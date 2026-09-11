"""
Archivist Agent
Manages chat history, memory, and historical data retrieval
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from qdrant_client.models import Filter, FieldCondition, MatchValue, PointStruct

logger = logging.getLogger(__name__)


class Archivist:
    """
    Agent responsible for:
    - Storing and retrieving chat history
    - Managing user memory and context
    - Archiving past sessions
    - Providing historical insights
    """
    
    def __init__(self, qdrant_client):
        """
        Initialize Archivist agent
        
        Args:
            qdrant_client: QdrantClient instance
        """
        self.client = qdrant_client
        self.collection_name = "chat_memory"
        self.archive_collection = "chat_history"
        
    async def store_message(
        self,
        user_id: str,
        session_id: str,
        message: str,
        embedding: List[float],
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Store a chat message in memory
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            message: Message content
            embedding: Vector embedding
            metadata: Additional metadata
            
        Returns:
            bool: Success status
        """
        try:
            import uuid as _uuid
            # Ensure collection exists before storing
            if not self.client.collection_exists(self.collection_name):
                from qdrant_client.models import VectorParams, Distance
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=len(embedding), distance=Distance.COSINE),
                )
                logger.info(f"📦 Created collection '{self.collection_name}' (size={len(embedding)})")

            point_id = str(_uuid.uuid4())
            payload = {
                "user_id": user_id,
                "session_id": session_id,
                "message": message,
                "timestamp": datetime.now().isoformat(),
                **metadata
            }

            print(f"📦 [Archivist.store_message] Storing msg='{message[:40]}' for user_id='{user_id}' session_id='{session_id}' (point_id={point_id})")
            logger.info(f"📦 [Archivist.store_message] Storing msg='{message[:40]}' for user_id='{user_id}' session_id='{session_id}' (point_id={point_id})")

            self.client.upsert(
                collection_name=self.collection_name,
                points=[PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload,
                )],
            )
            
            print(f"✅ [Archivist.store_message] Stored point {point_id} in '{self.collection_name}' successfully")
            logger.info(f"✅ [Archivist.store_message] Stored point {point_id} in '{self.collection_name}' successfully")
            return True
            
        except Exception as e:
            print(f"❌ [Archivist.store_message] Error storing message: {e}")
            logger.error(f"❌ [Archivist.store_message] Error storing message: {e}")
            return False
    
    async def retrieve_similar_messages(
        self,
        embedding: List[float],
        user_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar past messages for the given user.
        
        Args:
            embedding: Query embedding vector
            user_id: User identifier
            limit: Number of results to return
            
        Returns:
            List of similar messages with metadata
        """
        try:
            if not self.client.collection_exists(self.collection_name):
                print(f"🔍 [Archivist.retrieve] Collection '{self.collection_name}' does not exist yet. Returning []")
                logger.info(f"🔍 [Archivist.retrieve] Collection '{self.collection_name}' does not exist yet. Returning []")
                return []

            # qdrant-client 1.x: use query_points
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="user_id",
                            match=MatchValue(value=user_id)
                        )
                    ]
                ),
                limit=limit,
            ).points

            messages = [
                {
                    "score": result.score,
                    "message": result.payload.get("message"),
                    "timestamp": result.payload.get("timestamp"),
                    "metadata": result.payload
                }
                for result in results
            ]

            print(f"🔍 [Archivist.retrieve] user_id='{user_id}' -> found {len(messages)} matching records in '{self.collection_name}'")
            for idx, m in enumerate(messages):
                print(f"   [{idx}] score={m['score']:.4f} msg='{m['message'][:40]}...'")
            logger.info(f"📚 Retrieved {len(messages)} similar messages for user {user_id}")
            return messages

        except Exception as e:
            print(f"❌ [Archivist.retrieve] Error retrieving messages: {e}")
            logger.error(f"❌ [Archivist.retrieve] Error retrieving messages: {e}")
            return []

    def get_collection_points_count(self) -> int:
        """Return total number of points in the chat memory collection."""
        try:
            if self.client.collection_exists(self.collection_name):
                info = self.client.get_collection(self.collection_name)
                return info.points_count or 0
            return 0
        except Exception:
            return 0
    
    async def get_user_history(
        self,
        user_id: str,
        session_id: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get user's chat history
        
        Args:
            user_id: User identifier
            session_id: Optional session filter
            limit: Number of messages to return
            
        Returns:
            List of historical messages
        """
        try:
            filter_conditions = [
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value=user_id)
                )
            ]
            
            if session_id:
                filter_conditions.append(
                    FieldCondition(
                        key="session_id",
                        match=MatchValue(value=session_id)
                    )
                )
            
            points, _ = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(must=filter_conditions),
                limit=limit
            )
            
            history = [
                {
                    "message": point.payload.get("message"),
                    "timestamp": point.payload.get("timestamp"),
                    "session_id": point.payload.get("session_id"),
                    "metadata": point.payload
                }
                for point in points
            ]
            
            logger.info(f"📖 Retrieved {len(history)} historical messages for user {user_id}")
            return history
            
        except Exception as e:
            logger.error(f"❌ Error retrieving history: {e}")
            return []
    
    async def archive_session(
        self,
        user_id: str,
        session_id: str,
        summary: str
    ) -> bool:
        """
        Archive a completed session
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            summary: Session summary
            
        Returns:
            bool: Success status
        """
        try:
            # Store archive entry
            point_id = hash(f"archive_{user_id}_{session_id}") % (10**8)
            
            self.client.upsert(
                collection_name=self.archive_collection,
                points=[{
                    "id": point_id,
                    "vector": [0.0] * 384,  # Placeholder vector
                    "payload": {
                        "user_id": user_id,
                        "session_id": session_id,
                        "summary": summary,
                        "archived_at": datetime.now().isoformat()
                    }
                }]
            )
            
            logger.info(f"📦 Session {session_id} archived for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error archiving session: {e}")
            return False
