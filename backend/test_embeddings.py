"""
Test script for embedding and vector storage integration
"""

import sys
sys.path.insert(0, ".")

from embedding_service import embed_text, get_model_info
from vector_store import get_qdrant_client, initialize_collections, upsert_vector, search_vectors, COLLECTION_CHAT_MEMORY

def test_embedding():
    """Test embedding generation"""
    print("Testing embedding generation...")
    
    try:
        text = "I've been feeling really stressed and anxious lately."
        embedding = embed_text(text)
        print(f"✓ Generated embedding of dimension: {len(embedding)}")
        print(f"✓ First 5 values: {embedding[:5]}")
    except Exception as e:
        print(f"✗ Embedding test failed: {e}")
        raise


def test_model_info():
    """Test model information"""
    print("\nTesting model info...")
    
    try:
        info = get_model_info()
        print(f"✓ Model: {info['model_name']}")
        print(f"✓ Embedding dimension: {info['embedding_dimension']}")
        print(f"✓ Max sequence length: {info['max_seq_length']}")
    except Exception as e:
        print(f"✗ Model info test failed: {e}")
        raise


def test_vector_storage():
    """Test vector storage in Qdrant"""
    print("\nTesting vector storage...")
    
    try:
        # Initialize collections
        initialize_collections()
        print("✓ Collections initialized")
        
        # Generate and store embeddings
        texts = [
            "I'm struggling with depression",
            "Feeling overwhelmed by work",
            "Happy and content today"
        ]
        
        for text in texts:
            embedding = embed_text(text)
            point_id = upsert_vector(
                collection_name=COLLECTION_CHAT_MEMORY,
                vector=embedding,
                payload={
                    "text": text,
                    "type": "test"
                }
            )
            print(f"✓ Stored: '{text}' -> {point_id}")
        
    except Exception as e:
        print(f"✗ Vector storage test failed: {e}")
        raise


def test_vector_search():
    """Test vector similarity search"""
    print("\nTesting vector search...")
    
    try:
        query_text = "depression and sadness"
        query_embedding = embed_text(query_text)
        
        results = search_vectors(
            collection_name=COLLECTION_CHAT_MEMORY,
            query_vector=query_embedding,
            limit=3
        )
        
        print(f"✓ Search for '{query_text}' returned {len(results)} results")
        for i, result in enumerate(results):
            print(f"  {i+1}. Score: {result['score']:.4f} - {result['payload'].get('text', 'N/A')}")
        
    except Exception as e:
        print(f"✗ Vector search test failed: {e}")
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("Embedding and Vector Store Integration Test")
    print("=" * 60)
    
    try:
        test_embedding()
        test_model_info()
        test_vector_storage()
        test_vector_search()
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ Test suite failed: {e}")
        sys.exit(1)
