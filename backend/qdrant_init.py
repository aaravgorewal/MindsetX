"""
Qdrant Collection Initialization & Verification Script
Comprehensive startup function that ensures all required collections exist and are properly configured
"""

import logging
import sys
from typing import Dict, List, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, CollectionStatus

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Collection Configuration
COLLECTIONS_CONFIG = {
    "chat_memory": {
        "description": "Stores chat messages and user interactions with embeddings",
        "vector_size": 384,
        "distance": Distance.COSINE,
    },
    "phq9_vectors": {
        "description": "Stores PHQ-9 assessment scores and mental health data",
        "vector_size": 384,
        "distance": Distance.COSINE,
    },
    "wellness_content": {
        "description": "Stores wellness resources, articles, and recommendations",
        "vector_size": 384,
        "distance": Distance.COSINE,
    },
    "bio_consent_logs": {
        "description": "Stores HIPAA/FERPA compliance logs and consent tracking",
        "vector_size": 384,
        "distance": Distance.COSINE,
    },
    "student_wellness": {
        "description": "Core collection for aggregated student wellness data",
        "vector_size": 384,
        "distance": Distance.COSINE,
    },
    "chat_history": {
        "description": "Archive of chat conversation history",
        "vector_size": 384,
        "distance": Distance.COSINE,
    }
}


def initialize_qdrant_collections(client: QdrantClient) -> Dict[str, bool]:
    """
    Initialize all required Qdrant collections at startup.
    Creates collections if they don't exist, verifies if they do.
    
    Args:
        client: Qdrant client instance
        
    Returns:
        Dictionary with collection names as keys and initialization status as values
    """
    print("\n" + "="*70)
    print("🚀 QDRANT COLLECTION INITIALIZATION")
    print("="*70)
    
    initialization_results = {}
    
    try:
        # Get existing collections
        collections_response = client.get_collections()
        existing_collections = {c.name for c in collections_response.collections}
        print(f"\n📊 Found {len(existing_collections)} existing collection(s)")
        if existing_collections:
            for col_name in sorted(existing_collections):
                print(f"   ✓ {col_name}")
        
        print(f"\n📋 Initializing {len(COLLECTIONS_CONFIG)} required collections...")
        print("-"*70)
        
        # Initialize each collection
        for collection_name, config in COLLECTIONS_CONFIG.items():
            try:
                if collection_name in existing_collections:
                    # Verify collection configuration
                    collection_info = client.get_collection(collection_name)
                    
                    print(f"\n✓ Collection: {collection_name}")
                    print(f"   Status: Already exists")
                    print(f"   Description: {config['description']}")
                    print(f"   Vector size: {collection_info.config.params.vectors.size}")
                    print(f"   Points count: {collection_info.points_count}")
                    print(f"   Status: {collection_info.status}")
                    
                    initialization_results[collection_name] = True
                    
                else:
                    # Create new collection
                    print(f"\n➕ Collection: {collection_name}")
                    print(f"   Status: Creating...")
                    print(f"   Description: {config['description']}")
                    
                    client.create_collection(
                        collection_name=collection_name,
                        vectors_config=VectorParams(
                            size=config["vector_size"],
                            distance=config["distance"]
                        )
                    )
                    
                    # Verify creation
                    collection_info = client.get_collection(collection_name)
                    print(f"   ✅ Successfully created")
                    print(f"   Vector size: {collection_info.config.params.vectors.size}")
                    print(f"   Status: {collection_info.status}")
                    
                    initialization_results[collection_name] = True
                    
            except Exception as e:
                print(f"\n❌ Collection: {collection_name}")
                print(f"   Error: {str(e)}")
                initialization_results[collection_name] = False
                logger.error(f"Failed to initialize collection '{collection_name}': {e}")
        
        # Print summary
        print("\n" + "="*70)
        successful = sum(1 for v in initialization_results.values() if v)
        total = len(initialization_results)
        
        if successful == total:
            print(f"✅ SUCCESS: All {total} collections initialized successfully!")
            print("="*70 + "\n")
            return initialization_results
        else:
            failed = total - successful
            print(f"⚠️  PARTIAL SUCCESS: {successful}/{total} collections initialized")
            print(f"❌ {failed} collection(s) failed")
            print("="*70 + "\n")
            return initialization_results
            
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR during collection initialization:")
        print(f"   {str(e)}")
        print("="*70 + "\n")
        logger.error(f"Critical error during collection initialization: {e}")
        raise


def verify_qdrant_health(client: QdrantClient) -> bool:
    """
    Verify Qdrant is healthy and responsive.
    
    Args:
        client: Qdrant client instance
        
    Returns:
        True if healthy, False otherwise
    """
    print("\n🏥 VERIFYING QDRANT HEALTH")
    print("-"*70)
    
    try:
        # Test basic connectivity
        collections = client.get_collections()
        print(f"✓ Qdrant is responding")
        print(f"✓ Total collections: {len(collections.collections)}")
        
        # Get health info
        try:
            health = client.get_service_info()
            print(f"✓ Service version: {health.version}")
        except:
            print(f"⚠️  Could not retrieve version info")
        
        print("-"*70)
        return True
        
    except Exception as e:
        print(f"❌ Qdrant health check failed: {e}")
        print("-"*70)
        logger.error(f"Qdrant health check failed: {e}")
        return False


def get_collection_stats(client: QdrantClient) -> Dict[str, dict]:
    """
    Get statistics for all collections.
    
    Args:
        client: Qdrant client instance
        
    Returns:
        Dictionary with collection stats
    """
    stats = {}
    collections_response = client.get_collections()
    
    for collection in collections_response.collections:
        collection_info = client.get_collection(collection.name)
        stats[collection.name] = {
            "points_count": collection_info.points_count,
            "vectors_count": collection_info.vectors_count if hasattr(collection_info, 'vectors_count') else "N/A",
            "status": str(collection_info.status),
            "indexed_vectors_count": collection_info.config.params.indexed_vectors_count if hasattr(collection_info.config.params, 'indexed_vectors_count') else "N/A"
        }
    
    return stats


def startup_sequence(
    qdrant_url: str = None, 
    qdrant_api_key: str = None,
    qdrant_host: str = None, 
    qdrant_port: int = 6333, 
    qdrant_path: str = "./qdrant_data"
) -> bool:
    """
    Complete startup sequence for Qdrant initialization.
    
    Args:
        qdrant_url: Qdrant Cloud URL (PRIMARY)
        qdrant_api_key: Qdrant API Key (for Cloud)
        qdrant_host: Qdrant host for remote (SECONDARY)
        qdrant_port: Qdrant port
        qdrant_path: Local Qdrant path (FALLBACK)
        
    Returns:
        True if startup successful, False otherwise
    """
    print("\n" + "="*70)
    print("🚀 STARTING QDRANT INITIALIZATION SEQUENCE")
    print("="*70)
    
    try:
        # Initialize client - PRIMARY: Qdrant Cloud
        if qdrant_url and qdrant_api_key:
            print(f"\n🌥️  Connecting to Qdrant Cloud: {qdrant_url}")
            client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key, prefer_grpc=False)
        # SECONDARY: Remote Qdrant
        elif qdrant_host:
            print(f"\n📡 Connecting to remote Qdrant: {qdrant_host}:{qdrant_port}")
            client = QdrantClient(host=qdrant_host, port=qdrant_port, prefer_grpc=True)
        # FALLBACK: Local Qdrant
        else:
            print(f"\n💾 Connecting to Qdrant local: {qdrant_path}")
            client = QdrantClient(path=qdrant_path)
        
        # Verify health
        if not verify_qdrant_health(client):
            print("\n❌ Qdrant is not healthy. Aborting initialization.")
            return False
        
        # Initialize collections
        results = initialize_qdrant_collections(client)
        
        # Print final stats
        print("\n📊 COLLECTION STATISTICS")
        print("-"*70)
        stats = get_collection_stats(client)
        
        for collection_name in sorted(stats.keys()):
            stat = stats[collection_name]
            print(f"\n{collection_name}:")
            print(f"   Points: {stat['points_count']}")
            print(f"   Status: {stat['status']}")
        
        print("\n" + "="*70)
        print("✅ QDRANT INITIALIZATION COMPLETE")
        print("="*70 + "\n")
        
        return all(results.values())
        
    except Exception as e:
        print(f"\n❌ STARTUP SEQUENCE FAILED: {e}")
        print("="*70 + "\n")
        logger.error(f"Startup sequence failed: {e}")
        return False


if __name__ == "__main__":
    """
    Run as standalone script for testing/debugging
    Usage: python qdrant_init.py [--host HOST] [--port PORT] [--path PATH]
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize Qdrant collections")
    parser.add_argument("--host", default=None, help="Qdrant host (None for local)")
    parser.add_argument("--port", type=int, default=6333, help="Qdrant port")
    parser.add_argument("--path", default="./qdrant_data", help="Local Qdrant path")
    
    args = parser.parse_args()
    
    success = startup_sequence(
        qdrant_host=args.host,
        qdrant_port=args.port,
        qdrant_path=args.path
    )
    
    sys.exit(0 if success else 1)
