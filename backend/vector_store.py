"""
Qdrant Vector Store Module
Initializes and manages Qdrant client for vector memory storage
"""

import os
import logging
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env immediately
load_dotenv()

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid
import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Qdrant Cloud Configuration
# Using Qdrant Cloud instance with credentials
QDRANT_URL = os.getenv(
    "QDRANT_URL", 
    "https://314a50f1-6411-4aab-9147-2953bffd4c9c.australia-southeast1-0.gcp.cloud.qdrant.io:6333"
)
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)

# Legacy local configuration (kept for backward compatibility)
QDRANT_PATH = os.getenv("QDRANT_PATH", "./qdrant_data")
QDRANT_HOST = os.getenv("QDRANT_HOST", None)
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))

# Collection Names
COLLECTION_STUDENT_WELLNESS = "student_wellness"
COLLECTION_CHAT_HISTORY = "chat_history"
COLLECTION_CHAT_MEMORY = "chat_memory"
COLLECTION_PHQ9_VECTORS = "phq9_vectors"
COLLECTION_WELLNESS_CONTENT = "wellness_content"
COLLECTION_BIO_CONSENT_LOGS = "bio_consent_logs"
VECTOR_SIZE = 384  # Standard embedding size (can be adjusted based on your embeddings)

# Global Qdrant client instance and status tracking
_client: Optional[QdrantClient] = None
_qdrant_status: Dict[str, Any] = {
    "mode": "uninitialized",
    "configured_url": QDRANT_URL,
    "active_storage": None,
    "error": None,
}


def get_qdrant_status() -> Dict[str, Any]:
    """Return live status of the Qdrant connection."""
    return _qdrant_status


def get_qdrant_client() -> QdrantClient:
    """
    Get or create the Qdrant client instance.
    Uses Qdrant Cloud by default with environment variable override support.
    
    Configuration priority:
    1. QDRANT_URL + QDRANT_API_KEY (Cloud - PRIMARY)
    2. QDRANT_HOST + QDRANT_PORT + QDRANT_API_KEY (Remote)
    3. QDRANT_PATH (Local Persistent Mode)
    """
    global _client, _qdrant_status
    
    if _client is not None:
        return _client
    
    # 1. PRIMARY: Qdrant Cloud mode (using URL + API Key)
    if QDRANT_URL and QDRANT_API_KEY:
        logger.info(f"🌥️ Connecting to Qdrant Cloud: {QDRANT_URL}")
        try:
            cloud_client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY,
                prefer_grpc=False,
                timeout=5,
            )
            # Live verification ping to ensure cluster is reachable
            cloud_client.get_collections()
            _client = cloud_client
            _qdrant_status["mode"] = "Qdrant Cloud (Active)"
            _qdrant_status["active_storage"] = QDRANT_URL
            _qdrant_status["error"] = None
            logger.info("✅ Verified active connection to Qdrant Cloud")
            return _client
        except Exception as e:
            err_str = str(e)
            logger.warning(
                f"❌ Qdrant Cloud connection failed: {err_str}. "
                f"Falling back to local persistent storage at {QDRANT_PATH}"
            )
            _qdrant_status["error"] = err_str

    # 2. SECONDARY: Remote server mode
    if QDRANT_HOST:
        try:
            logger.info(f"📡 Connecting to remote Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
            remote_client = QdrantClient(
                host=QDRANT_HOST,
                port=QDRANT_PORT,
                api_key=QDRANT_API_KEY,
                prefer_grpc=True,
                timeout=5,
            )
            remote_client.get_collections()
            _client = remote_client
            _qdrant_status["mode"] = "Qdrant Remote (Active)"
            _qdrant_status["active_storage"] = f"{QDRANT_HOST}:{QDRANT_PORT}"
            _qdrant_status["error"] = None
            logger.info("✅ Connected to remote Qdrant successfully")
            return _client
        except Exception as e:
            logger.warning(f"❌ Remote Qdrant connection failed: {e}")
            _qdrant_status["error"] = str(e)

    # 3. FALLBACK: Local mode (embedded persistent storage)
    os.makedirs(QDRANT_PATH, exist_ok=True)
    logger.info(f"💾 Initializing Qdrant local persistent mode at {QDRANT_PATH}")
    _client = QdrantClient(path=QDRANT_PATH)
    
    if _qdrant_status["error"]:
        _qdrant_status["mode"] = f"Qdrant Local Mode (Cloud Unreachable: {_qdrant_status['error']})"
    else:
        _qdrant_status["mode"] = "Qdrant Local Mode"
    _qdrant_status["active_storage"] = os.path.abspath(QDRANT_PATH)
    
    logger.info(f"✅ Initialized Qdrant local mode successfully at {QDRANT_PATH}")
    return _client


def initialize_collections() -> None:
    """
    Initialize all required Qdrant collections at startup.
    Creates collections if they don't already exist.
    """
    client = get_qdrant_client()
    
    try:
        collections = client.get_collections().collections
        existing_names = [c.name for c in collections]
        
        # Initialize Student Wellness collection
        if COLLECTION_STUDENT_WELLNESS not in existing_names:
            logger.info(f"Creating collection: {COLLECTION_STUDENT_WELLNESS}")
            client.create_collection(
                collection_name=COLLECTION_STUDENT_WELLNESS,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                optimizers_config=None
            )
            logger.info(f"✓ Collection '{COLLECTION_STUDENT_WELLNESS}' created")
        else:
            logger.info(f"✓ Collection '{COLLECTION_STUDENT_WELLNESS}' already exists")
        
        # Initialize Chat History collection
        if COLLECTION_CHAT_HISTORY not in existing_names:
            logger.info(f"Creating collection: {COLLECTION_CHAT_HISTORY}")
            client.create_collection(
                collection_name=COLLECTION_CHAT_HISTORY,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                optimizers_config=None
            )
            logger.info(f"✓ Collection '{COLLECTION_CHAT_HISTORY}' created")
        else:
            logger.info(f"✓ Collection '{COLLECTION_CHAT_HISTORY}' already exists")
        
        # Initialize Chat Memory collection for storing embeddings
        if COLLECTION_CHAT_MEMORY not in existing_names:
            logger.info(f"Creating collection: {COLLECTION_CHAT_MEMORY}")
            client.create_collection(
                collection_name=COLLECTION_CHAT_MEMORY,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                optimizers_config=None
            )
            logger.info(f"✓ Collection '{COLLECTION_CHAT_MEMORY}' created")
        else:
            logger.info(f"✓ Collection '{COLLECTION_CHAT_MEMORY}' already exists")
        
        # Initialize PHQ-9 vectors collection
        if COLLECTION_PHQ9_VECTORS not in existing_names:
            logger.info(f"Creating collection: {COLLECTION_PHQ9_VECTORS}")
            client.create_collection(
                collection_name=COLLECTION_PHQ9_VECTORS,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                optimizers_config=None
            )
            logger.info(f"✓ Collection '{COLLECTION_PHQ9_VECTORS}' created")
        else:
            logger.info(f"✓ Collection '{COLLECTION_PHQ9_VECTORS}' already exists")
        
        # Initialize Wellness Content collection
        if COLLECTION_WELLNESS_CONTENT not in existing_names:
            logger.info(f"Creating collection: {COLLECTION_WELLNESS_CONTENT}")
            client.create_collection(
                collection_name=COLLECTION_WELLNESS_CONTENT,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                optimizers_config=None
            )
            logger.info(f"✓ Collection '{COLLECTION_WELLNESS_CONTENT}' created")
        else:
            logger.info(f"✓ Collection '{COLLECTION_WELLNESS_CONTENT}' already exists")
        
        # Initialize Bio-Consent Logs collection for HIPAA/FERPA compliance tracking
        if COLLECTION_BIO_CONSENT_LOGS not in existing_names:
            logger.info(f"Creating collection: {COLLECTION_BIO_CONSENT_LOGS}")
            client.create_collection(
                collection_name=COLLECTION_BIO_CONSENT_LOGS,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                optimizers_config=None
            )
            logger.info(f"✓ Collection '{COLLECTION_BIO_CONSENT_LOGS}' created")
        else:
            logger.info(f"✓ Collection '{COLLECTION_BIO_CONSENT_LOGS}' already exists")
        
        logger.info("All Qdrant collections initialized successfully")
    
    except Exception as e:
        logger.error(f"Failed to initialize collections: {e}")
        raise


def upsert_vector(
    collection_name: str,
    vector: List[float],
    payload: Dict[str, Any],
    point_id: Optional[str] = None
) -> str:
    """
    Upsert a single vector into the collection.
    
    Args:
        collection_name: Name of the collection
        vector: Vector embedding
        payload: Metadata associated with the vector
        point_id: Optional custom ID (auto-generated if not provided)
    
    Returns:
        The point ID of the upserted vector
    """
    client = get_qdrant_client()
    point_id = point_id or str(uuid.uuid4())
    
    try:
        point = PointStruct(
            id=point_id,
            vector=vector,
            payload={
                **payload,
                "timestamp": datetime.datetime.now().isoformat()
            }
        )
        
        client.upsert(
            collection_name=collection_name,
            points=[point]
        )
        logger.debug(f"Vector upserted to {collection_name}: {point_id}")
        return point_id
    
    except Exception as e:
        logger.error(f"Failed to upsert vector: {e}")
        raise


def search_vectors(
    collection_name: str,
    query_vector: List[float],
    limit: int = 5,
    score_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Search for similar vectors in the collection.
    
    Args:
        collection_name: Name of the collection
        query_vector: Query vector for similarity search
        limit: Maximum number of results to return
        score_threshold: Optional minimum similarity score
    
    Returns:
        List of matching points with scores and payloads
    """
    client = get_qdrant_client()
    
    try:
        results = client.query_points(
            collection_name=collection_name,
            query=query_vector,
            limit=limit,
            score_threshold=score_threshold
        ).points
        
        return [
            {
                "id": result.id,
                "score": result.score,
                "payload": result.payload
            }
            for result in results
        ]
    
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise


def get_point_by_id(collection_name: str, point_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a specific point by ID.
    
    Args:
        collection_name: Name of the collection
        point_id: ID of the point to retrieve
    
    Returns:
        Point data with vector and payload, or None if not found
    """
    client = get_qdrant_client()
    
    try:
        point = client.retrieve(
            collection_name=collection_name,
            ids=[point_id],
            with_vectors=True
        )
        
        if point:
            return {
                "id": point[0].id,
                "vector": point[0].vector,
                "payload": point[0].payload
            }
        return None
    
    except Exception as e:
        logger.error(f"Failed to retrieve point: {e}")
        raise


def delete_points(collection_name: str, point_ids: List[str]) -> None:
    """
    Delete points from a collection.
    
    Args:
        collection_name: Name of the collection
        point_ids: List of point IDs to delete
    """
    client = get_qdrant_client()
    
    try:
        client.delete(
            collection_name=collection_name,
            points_selector=point_ids
        )
        logger.debug(f"Deleted {len(point_ids)} points from {collection_name}")
    
    except Exception as e:
        logger.error(f"Failed to delete points: {e}")
        raise


def get_collection_stats(collection_name: str) -> Dict[str, Any]:
    """
    Get statistics about a collection.
    
    Args:
        collection_name: Name of the collection
    
    Returns:
        Collection statistics
    """
    client = get_qdrant_client()
    
    try:
        info = client.get_collection(collection_name)
        return {
            "name": collection_name,
            "points_count": info.points_count,
            "vectors_count": info.vectors_count,
            "status": info.status,
            "vector_size": VECTOR_SIZE
        }
    
    except Exception as e:
        logger.error(f"Failed to get collection stats: {e}")
        raise


def health_check() -> Dict[str, Any]:
    """
    Check Qdrant client health and connectivity.
    
    Returns:
        Health status information
    """
    try:
        client = get_qdrant_client()
        collections = client.get_collections().collections
        
        return {
            "status": "healthy",
            "mode": "remote" if QDRANT_HOST else "local",
            "collections": [c.name for c in collections],
            "total_collections": len(collections)
        }
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }
