"""
Quick test of PHQ-9 endpoint integration
"""

import sys
sys.path.insert(0, ".")

# Test imports
print("Testing imports...")
try:
    from vector_store import COLLECTION_PHQ9_VECTORS
    from embedding_service import embed_text
    print(f"✓ Successfully imported COLLECTION_PHQ9_VECTORS: {COLLECTION_PHQ9_VECTORS}")
    print(f"✓ Successfully imported embed_text")
    
    # Test embedding a PHQ-9 response sample
    sample_text = "Feeling down depressed hopeless - Nearly every day\nLittle interest or pleasure in doing things - More than half the days"
    embedding = embed_text(sample_text)
    print(f"✓ Generated embedding with {len(embedding)} dimensions")
    
    print("\n✓ All imports and basic functions working!")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
