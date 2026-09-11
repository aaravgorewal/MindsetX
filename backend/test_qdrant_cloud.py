"""
Test script to verify Qdrant Cloud connection
"""

from qdrant_client import QdrantClient

# Qdrant Cloud credentials
QDRANT_URL = "https://eae25781-9692-48dd-a657-10bc8c0874db.us-east4-0.gcp.cloud.qdrant.io:6333"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.YaMCJ4-ePHYX7jCmxuEFrRqP0jMGoBN5HY_gV9JmkY0"

def test_qdrant_cloud_connection():
    """Test connection to Qdrant Cloud"""
    print("="*70)
    print("🧪 Testing Qdrant Cloud Connection")
    print("="*70)
    
    try:
        print(f"\n📍 URL: {QDRANT_URL}")
        print(f"🔑 API Key: {QDRANT_API_KEY[:20]}...")
        
        # Create client
        print("\n⏳ Connecting to Qdrant Cloud...")
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            prefer_grpc=False
        )
        
        print("✅ Successfully connected to Qdrant Cloud!\n")
        
        # Get collections
        print("📦 Fetching collections...\n")
        collections = client.get_collections()
        
        print(f"✓ Found {len(collections.collections)} collection(s):\n")
        for collection in collections.collections:
            print(f"   • {collection.name}")
            try:
                info = client.get_collection(collection.name)
                print(f"     - Points: {info.points_count}")
                print(f"     - Vector size: {info.config.params.vectors.size}")
            except Exception as e:
                print(f"     - Error getting info: {e}")
        
        print("\n" + "="*70)
        print("✅ QDRANT CLOUD CONNECTION TEST PASSED")
        print("="*70)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\n" + "="*70)
        print("❌ QDRANT CLOUD CONNECTION TEST FAILED")
        print("="*70)
        return False

if __name__ == "__main__":
    success = test_qdrant_cloud_connection()
    exit(0 if success else 1)
