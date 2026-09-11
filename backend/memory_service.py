"""
Memory Retrieval Service
Implements hybrid semantic search for similar past sessions from Qdrant
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np

from embedding_service import embed_text, similarity_score
from vector_store import (
    get_qdrant_client,
    search_vectors,
    COLLECTION_CHAT_MEMORY,
    COLLECTION_PHQ9_VECTORS
)

logger = logging.getLogger(__name__)

# Configuration
DEFAULT_LIMIT = 5
DEFAULT_SCORE_THRESHOLD = 0.3
DEFAULT_TIME_WINDOW_DAYS = 90


class MemoryRetriever:
    """Hybrid semantic search for similar past sessions"""
    
    @staticmethod
    def query_similar_sessions(
        query_text: str,
        student_id: Optional[str] = None,
        collection_name: str = COLLECTION_CHAT_MEMORY,
        limit: int = DEFAULT_LIMIT,
        score_threshold: float = DEFAULT_SCORE_THRESHOLD,
        time_window_days: int = DEFAULT_TIME_WINDOW_DAYS,
        include_metadata: bool = True,
        session_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query similar past sessions using hybrid semantic search
        
        Args:
            query_text: Text query to find similar sessions
            student_id: Optional filter by student
            collection_name: Which collection to search
            limit: Maximum results to return
            score_threshold: Minimum similarity score (0-1)
            time_window_days: Only search last N days
            include_metadata: Include full metadata in results
            session_type: Filter by session type (chat/assessment/both)
        
        Returns:
            Dict with:
            - total_found: Number of results
            - results: List of similar sessions with scores
            - query_embedding: Embedding used for search
            - search_params: Parameters used
        """
        try:
            # 1. Embed the query text
            query_embedding = embed_text(query_text)
            logger.info(f"✓ Query embedded: {len(query_embedding)} dimensions")
            
            # 2. Search Qdrant
            client = get_qdrant_client()
            
            # Build search filters
            filter_conditions = []
            
            # Time window filter (last N days)
            cutoff_date = (datetime.now() - timedelta(days=time_window_days)).isoformat()
            if hasattr(client, 'query_points'):
                # Qdrant v0.x compatibility
                search_result = search_vectors(
                    collection_name=collection_name,
                    query_vector=query_embedding,
                    limit=limit,
                    score_threshold=score_threshold
                )
            else:
                # Fallback
                search_result = []
            
            # 3. Post-process results
            results = []
            for item in search_result:
                result_dict = {
                    "vector_id": item.get("id"),
                    "similarity_score": item.get("score", 0),
                    "content": item.get("payload", {}).get("content", ""),
                    "session_id": item.get("payload", {}).get("session_id", ""),
                    "student_id": item.get("payload", {}).get("student_id", ""),
                    "timestamp": item.get("payload", {}).get("timestamp", ""),
                    "metadata": item.get("payload", {}) if include_metadata else {}
                }
                
                # Apply student filter if specified
                if student_id and result_dict["student_id"] != student_id:
                    continue
                
                # Apply time window filter
                if "timestamp" in item.get("payload", {}):
                    ts = item["payload"]["timestamp"]
                    if ts < cutoff_date:
                        continue
                
                results.append(result_dict)
            
            logger.info(f"✓ Found {len(results)} similar sessions")
            
            return {
                "status": "success",
                "total_found": len(results),
                "results": results[:limit],
                "query_embedding_dim": len(query_embedding),
                "search_params": {
                    "collection": collection_name,
                    "limit": limit,
                    "score_threshold": score_threshold,
                    "time_window_days": time_window_days,
                    "student_filter": student_id,
                    "session_type": session_type
                },
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"✗ Query failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "total_found": 0,
                "results": []
            }
    
    @staticmethod
    def find_similar_chat_sessions(
        message: str,
        student_id: Optional[str] = None,
        limit: int = DEFAULT_LIMIT,
        mood_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Find similar chat messages/sessions
        
        Args:
            message: User message to find similar
            student_id: Optional student filter
            limit: Number of results
            mood_filter: Filter by mood (positive/neutral/negative)
        
        Returns:
            Similar chat sessions with context
        """
        result = MemoryRetriever.query_similar_sessions(
            query_text=message,
            student_id=student_id,
            collection_name=COLLECTION_CHAT_MEMORY,
            limit=limit,
            session_type="chat"
        )
        
        # Enhance with conversation context
        if result["status"] == "success":
            for item in result["results"]:
                # Add message preview (first 100 chars)
                content = item.get("content", "")
                item["content_preview"] = content[:100] + "..." if len(content) > 100 else content
                
                # Classify sentiment
                if content:
                    from textblob import TextBlob
                    sentiment = TextBlob(content).sentiment.polarity
                    item["sentiment"] = sentiment
                    if mood_filter:
                        if mood_filter == "positive" and sentiment < 0.1:
                            continue
                        elif mood_filter == "negative" and sentiment > -0.1:
                            continue
        
        return result
    
    @staticmethod
    def find_similar_assessments(
        assessment_text: str,
        student_id: Optional[str] = None,
        limit: int = DEFAULT_LIMIT,
        severity_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Find similar PHQ-9 assessments
        
        Args:
            assessment_text: Assessment text/description
            student_id: Optional student filter
            limit: Number of results
            severity_filter: Filter by severity level
        
        Returns:
            Similar assessments with scores
        """
        result = MemoryRetriever.query_similar_sessions(
            query_text=assessment_text,
            student_id=student_id,
            collection_name=COLLECTION_PHQ9_VECTORS,
            limit=limit,
            session_type="assessment"
        )
        
        # Enhance with assessment details
        if result["status"] == "success":
            for item in result["results"]:
                payload = item.get("metadata", {})
                item["total_score"] = payload.get("total_score", 0)
                item["severity"] = payload.get("severity", "Unknown")
                item["assessment_date"] = payload.get("timestamp", "")
                
                # Apply severity filter if specified
                if severity_filter and payload.get("severity") != severity_filter:
                    continue
        
        return result
    
    @staticmethod
    def cross_collection_search(
        query_text: str,
        student_id: Optional[str] = None,
        limit: int = 3
    ) -> Dict[str, Any]:
        """
        Search across both chat and PHQ-9 collections
        Returns most similar items from each
        
        Args:
            query_text: Query text
            student_id: Optional student filter
            limit: Results per collection
        
        Returns:
            Combined results from both collections
        """
        chat_results = MemoryRetriever.find_similar_chat_sessions(
            message=query_text,
            student_id=student_id,
            limit=limit
        )
        
        assessment_results = MemoryRetriever.find_similar_assessments(
            assessment_text=query_text,
            student_id=student_id,
            limit=limit
        )
        
        return {
            "status": "success",
            "query": query_text,
            "student_id": student_id,
            "chat_sessions": chat_results.get("results", []),
            "assessments": assessment_results.get("results", []),
            "total_results": len(chat_results.get("results", [])) + len(assessment_results.get("results", [])),
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def analyze_session_context(
        session_id: str,
        context_window: int = 3
    ) -> Dict[str, Any]:
        """
        Get context around a specific session
        
        Args:
            session_id: Session to analyze
            context_window: Number of related sessions to find
        
        Returns:
            Session with contextual similar sessions
        """
        try:
            # Find the session
            client = get_qdrant_client()
            
            # Search for session in chat memory first
            search_result = search_vectors(
                collection_name=COLLECTION_CHAT_MEMORY,
                query_vector=[0] * 384,  # Placeholder
                limit=100
            )
            
            target_session = None
            for item in search_result:
                if item.get("id") == session_id or item.get("payload", {}).get("session_id") == session_id:
                    target_session = item
                    break
            
            if not target_session:
                return {
                    "status": "error",
                    "error": f"Session {session_id} not found"
                }
            
            # Get context
            if target_session.get("payload", {}).get("content"):
                context_results = MemoryRetriever.query_similar_sessions(
                    query_text=target_session["payload"]["content"],
                    student_id=target_session["payload"].get("student_id"),
                    limit=context_window
                )
            else:
                context_results = {"results": []}
            
            return {
                "status": "success",
                "session": {
                    "id": target_session.get("id"),
                    "content": target_session.get("payload", {}).get("content", ""),
                    "timestamp": target_session.get("payload", {}).get("timestamp", ""),
                    "student_id": target_session.get("payload", {}).get("student_id", "")
                },
                "similar_sessions": context_results.get("results", []),
                "context_count": len(context_results.get("results", []))
            }
        
        except Exception as e:
            logger.error(f"✗ Context analysis failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }


def query_similar_sessions(
    query_text: str,
    student_id: Optional[str] = None,
    collection_name: str = COLLECTION_CHAT_MEMORY,
    limit: int = DEFAULT_LIMIT,
    score_threshold: float = DEFAULT_SCORE_THRESHOLD,
    time_window_days: int = DEFAULT_TIME_WINDOW_DAYS
) -> Dict[str, Any]:
    """Convenient wrapper function"""
    return MemoryRetriever.query_similar_sessions(
        query_text=query_text,
        student_id=student_id,
        collection_name=collection_name,
        limit=limit,
        score_threshold=score_threshold,
        time_window_days=time_window_days
    )


def find_similar_chat_sessions(
    message: str,
    student_id: Optional[str] = None,
    limit: int = DEFAULT_LIMIT
) -> Dict[str, Any]:
    """Convenient wrapper function"""
    return MemoryRetriever.find_similar_chat_sessions(
        message=message,
        student_id=student_id,
        limit=limit
    )


def find_similar_assessments(
    assessment_text: str,
    student_id: Optional[str] = None,
    limit: int = DEFAULT_LIMIT
) -> Dict[str, Any]:
    """Convenient wrapper function"""
    return MemoryRetriever.find_similar_assessments(
        assessment_text=assessment_text,
        student_id=student_id,
        limit=limit
    )


def cross_collection_search(
    query_text: str,
    student_id: Optional[str] = None,
    limit: int = 3
) -> Dict[str, Any]:
    """Convenient wrapper function"""
    return MemoryRetriever.cross_collection_search(
        query_text=query_text,
        student_id=student_id,
        limit=limit
    )
