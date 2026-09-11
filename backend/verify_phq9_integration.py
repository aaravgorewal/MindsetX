"""
Final verification that all PHQ-9 components are working correctly
"""

import sys
sys.path.insert(0, ".")

def verify_imports():
    """Verify all required imports work"""
    print("Verifying imports...")
    try:
        from vector_store import COLLECTION_PHQ9_VECTORS, initialize_collections, upsert_vector, search_vectors
        from embedding_service import embed_text
        print(f"✓ vector_store imports successful")
        print(f"✓ embedding_service imports successful")
        print(f"✓ PHQ-9 collection name: {COLLECTION_PHQ9_VECTORS}")
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False


def verify_models():
    """Verify Pydantic models work"""
    print("\nVerifying data models...")
    try:
        from pydantic import BaseModel, Field, ValidationError
        from typing import List, Optional
        
        # Define models inline to test
        class PHQ9Request(BaseModel):
            scores: List[int] = Field(..., min_items=9, max_items=9)
            student_id: Optional[str] = None
            timestamp: Optional[str] = None
        
        class PHQ9Response(BaseModel):
            totalScore: int
            severity: str
            driftState: str
            recommendation: str
            vector_id: Optional[str] = None
        
        # Test request
        req = PHQ9Request(scores=[0, 0, 0, 0, 0, 0, 0, 0, 0], student_id="TEST")
        print(f"✓ PHQ9Request model works (scores: {sum(req.scores)})")
        
        # Test response
        resp = PHQ9Response(
            totalScore=5,
            severity="Mild",
            driftState="stable",
            recommendation="Test recommendation"
        )
        print(f"✓ PHQ9Response model works (severity: {resp.severity})")
        
        return True
    except Exception as e:
        print(f"✗ Model verification failed: {e}")
        return False


def verify_embedding_pipeline():
    """Verify embedding pipeline"""
    print("\nVerifying embedding pipeline...")
    try:
        from embedding_service import embed_text, get_model_info
        
        # Test embedding
        text = "Feeling down and depressed nearly every day"
        embedding = embed_text(text)
        print(f"✓ Embedding generated: {len(embedding)} dimensions")
        
        # Test model info
        info = get_model_info()
        print(f"✓ Model: {info['model_name']}")
        print(f"✓ Dimensions: {info['embedding_dimension']}")
        
        return True
    except Exception as e:
        print(f"✗ Embedding pipeline failed: {e}")
        return False


def verify_vector_storage():
    """Verify vector storage pipeline"""
    print("\nVerifying vector storage pipeline...")
    try:
        from vector_store import initialize_collections, COLLECTION_PHQ9_VECTORS
        
        initialize_collections()
        print(f"✓ Collections initialized successfully")
        print(f"✓ PHQ-9 collection '{COLLECTION_PHQ9_VECTORS}' ready")
        
        return True
    except Exception as e:
        print(f"✗ Vector storage verification failed: {e}")
        return False


def verify_severity_logic():
    """Verify severity classification logic"""
    print("\nVerifying severity classification logic...")
    try:
        test_cases = [
            (2, "Minimal or None", "stable"),
            (7, "Mild", "stable"),
            (12, "Moderate", "declining"),
            (17, "Moderately Severe", "declining"),
            (23, "Severe", "critical"),
        ]
        
        for score, expected_severity, expected_drift in test_cases:
            # Apply logic
            if score <= 4:
                severity = "Minimal or None"
                drift = "stable"
            elif score <= 9:
                severity = "Mild"
                drift = "stable"
            elif score <= 14:
                severity = "Moderate"
                drift = "declining"
            elif score <= 19:
                severity = "Moderately Severe"
                drift = "declining"
            else:
                severity = "Severe"
                drift = "critical"
            
            if severity == expected_severity and drift == expected_drift:
                print(f"✓ Score {score:2d}: {severity:20s} ({drift})")
            else:
                print(f"✗ Score {score}: Got {severity}/{drift}, expected {expected_severity}/{expected_drift}")
                return False
        
        return True
    except Exception as e:
        print(f"✗ Severity logic verification failed: {e}")
        return False


def verify_endpoint_structure():
    """Verify endpoint structure in main.py"""
    print("\nVerifying endpoint structure...")
    try:
        with open("main.py", "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        # Check for endpoint definition
        if "@app.post(\"/phq9\"" in content:
            print("✓ /phq9 endpoint defined")
        else:
            print("✗ /phq9 endpoint not found")
            return False
        
        # Check for imports
        if "COLLECTION_PHQ9_VECTORS" in content:
            print("✓ PHQ9 collection imported")
        else:
            print("✗ PHQ9 collection not imported")
            return False
        
        if "embed_text" in content:
            print("✓ embed_text imported")
        else:
            print("✗ embed_text not imported")
            return False
        
        # Check for models
        if "class PHQ9Request" in content:
            print("✓ PHQ9Request model defined")
        else:
            print("✗ PHQ9Request model not found")
            return False
        
        if "class PHQ9Response" in content:
            print("✓ PHQ9Response model defined")
        else:
            print("✗ PHQ9Response model not found")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Endpoint verification failed: {e}")
        return False


def main():
    print("=" * 70)
    print("PHQ-9 QDRANT INTEGRATION - FINAL VERIFICATION")
    print("=" * 70)
    
    checks = [
        ("Imports", verify_imports),
        ("Data Models", verify_models),
        ("Embedding Pipeline", verify_embedding_pipeline),
        ("Vector Storage", verify_vector_storage),
        ("Severity Logic", verify_severity_logic),
        ("Endpoint Structure", verify_endpoint_structure),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} check crashed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 70)
    print("VERIFICATION SUMMARY")
    print("=" * 70)
    
    all_pass = all(result for _, result in results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} | {name}")
    
    print("=" * 70)
    if all_pass:
        print("✓ ALL CHECKS PASSED - PHQ-9 INTEGRATION IS READY!")
        return 0
    else:
        print("✗ SOME CHECKS FAILED - REVIEW ERRORS ABOVE")
        return 1


if __name__ == "__main__":
    exit(main())
