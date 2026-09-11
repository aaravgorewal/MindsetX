"""
Test script for drift detection endpoint
"""

import sys
sys.path.insert(0, ".")

import uuid
from embedding_service import embed_text
from vector_store import initialize_collections, upsert_vector, COLLECTION_CHAT_MEMORY, COLLECTION_PHQ9_VECTORS
from drift_service import analyze_overall_drift, analyze_chat_drift, analyze_phq9_drift, calculate_drift_score
import numpy as np

def test_drift_calculation():
    """Test drift score calculation"""
    print("Testing drift score calculation...")
    
    try:
        # Create synthetic vectors simulating similar mental states
        current_vector = np.array([0.1, 0.2, 0.3, 0.4, 0.5])
        historical_vectors = [
            np.array([0.1, 0.2, 0.3, 0.4, 0.5]),  # Nearly identical
            np.array([0.11, 0.21, 0.29, 0.41, 0.49]),  # Very similar
            np.array([0.15, 0.25, 0.25, 0.45, 0.45]),  # Similar
            np.array([0.3, 0.4, 0.2, 0.3, 0.6]),  # Different
        ]
        
        historical_vectors = [v.tolist() for v in historical_vectors]
        current_vector = current_vector.tolist()
        
        result = calculate_drift_score(current_vector, historical_vectors)
        
        print(f"✓ Drift Score: {result['drift_score']:.3f}")
        print(f"✓ Status: {result['drift_status']}")
        print(f"✓ Description: {result['description']}")
        
        return True
    except Exception as e:
        print(f"✗ Drift calculation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def create_sample_chat_data():
    """Create sample chat messages for testing"""
    print("\nCreating sample chat data...")
    
    try:
        initialize_collections()
        
        student_id = "TEST_STUDENT_001"
        session_id = student_id
        
        # Simulate a series of chat messages showing emotional trajectory
        messages = [
            ("I'm feeling better today, managed to sleep well", "improving"),
            ("Still a bit anxious but managing better", "stable"),
            ("Feeling overwhelmed again, hard to focus", "declining"),
            ("Really struggling today, feeling very sad", "declining"),
            ("Another bad day, everything feels hopeless", "critical"),
        ]
        
        for i, (message, state) in enumerate(messages):
            embedding = embed_text(message)
            vector_id = upsert_vector(
                collection_name=COLLECTION_CHAT_MEMORY,
                vector=embedding,
                payload={
                    "session_id": session_id,
                    "student_id": student_id,
                    "role": "user",
                    "content": message,
                    "emotional_state": state
                }
            )
            print(f"  {i+1}. {state:12s} | {message[:40]}... -> {vector_id[:8]}...")
        
        return True
    except Exception as e:
        print(f"✗ Sample data creation failed: {e}")
        return False


def create_sample_phq9_data():
    """Create sample PHQ-9 assessments for testing"""
    print("\nCreating sample PHQ-9 data...")
    
    try:
        initialize_collections()
        
        student_id = "TEST_STUDENT_001"
        
        # Simulate PHQ-9 scores showing worsening trend
        assessments = [
            {
                "scores": [0, 0, 1, 0, 0, 1, 0, 0, 0],  # Score: 2 (Minimal)
                "severity": "Minimal or None",
                "label": "Baseline - Good mental health"
            },
            {
                "scores": [1, 1, 1, 1, 0, 1, 1, 0, 0],  # Score: 6 (Mild)
                "severity": "Mild",
                "label": "Slightly elevated symptoms"
            },
            {
                "scores": [2, 2, 1, 2, 1, 2, 1, 0, 0],  # Score: 11 (Moderate)
                "severity": "Moderate",
                "label": "Moderate depression developing"
            },
            {
                "scores": [2, 3, 2, 3, 2, 3, 2, 1, 1],  # Score: 19 (Moderately Severe)
                "severity": "Moderately Severe",
                "label": "Significant worsening"
            },
        ]
        
        for i, assessment in enumerate(assessments):
            text_parts = [
                "Little interest or pleasure in doing things" if assessment["scores"][0] > 0 else "",
                "Feeling down, depressed, or hopeless" if assessment["scores"][1] > 0 else "",
                "Trouble sleeping" if assessment["scores"][2] > 0 else "",
            ]
            text = " | ".join([t for t in text_parts if t])
            
            embedding = embed_text(text or "Minimal symptoms")
            total_score = sum(assessment["scores"])
            
            vector_id = upsert_vector(
                collection_name=COLLECTION_PHQ9_VECTORS,
                vector=embedding,
                payload={
                    "student_id": student_id,
                    "scores": assessment["scores"],
                    "total_score": total_score,
                    "severity": assessment["severity"],
                    "assessment_text": text
                }
            )
            print(f"  {i+1}. Score {total_score:2d}/27 ({assessment['severity']:20s}) -> {vector_id[:8]}...")
        
        return True
    except Exception as e:
        print(f"✗ PHQ-9 sample data creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_chat_drift():
    """Test chat drift analysis"""
    print("\nTesting chat drift analysis...")
    
    try:
        result = analyze_chat_drift(student_id="TEST_STUDENT_001", limit_history=4)
        
        chat_drift = result.get("chat_drift", {})
        drift_score = chat_drift.get("drift_score", 0)
        drift_status = chat_drift.get("drift_status", "unknown")
        message_count = result.get("message_count", 0)
        
        print(f"✓ Chat Drift Score: {drift_score:.3f}")
        print(f"✓ Chat Drift Status: {drift_status}")
        print(f"✓ Messages analyzed: {message_count}")
        
        if "similarity_stats" in chat_drift:
            stats = chat_drift["similarity_stats"]
            print(f"  - Average similarity: {stats.get('average', 0):.3f}")
            print(f"  - Std deviation: {stats.get('std_deviation', 0):.3f}")
        
        return True
    except Exception as e:
        print(f"✗ Chat drift analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_phq9_drift():
    """Test PHQ-9 drift analysis"""
    print("\nTesting PHQ-9 drift analysis...")
    
    try:
        result = analyze_phq9_drift(student_id="TEST_STUDENT_001", limit_history=3)
        
        phq9_drift = result.get("phq9_drift", {})
        drift_score = phq9_drift.get("drift_score", 0)
        drift_status = phq9_drift.get("drift_status", "unknown")
        assessment_count = result.get("assessment_count", 0)
        
        latest = result.get("latest_assessment", {})
        score = latest.get("score", 0)
        severity = latest.get("severity", "Unknown")
        trend = latest.get("score_trend", "unknown")
        
        print(f"✓ PHQ-9 Drift Score: {drift_score:.3f}")
        print(f"✓ PHQ-9 Drift Status: {drift_status}")
        print(f"✓ Assessments analyzed: {assessment_count}")
        print(f"✓ Latest score: {score}/27 ({severity})")
        print(f"✓ Score trend: {trend}")
        
        return True
    except Exception as e:
        print(f"✗ PHQ-9 drift analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_overall_drift():
    """Test overall drift analysis"""
    print("\nTesting overall drift analysis...")
    
    try:
        result = analyze_overall_drift(student_id="TEST_STUDENT_001")
        
        overall_score = result.get("overall_drift_score", 0)
        overall_status = result.get("overall_status", "unknown")
        alert_level = result.get("alert_level", "unknown")
        recommendations = result.get("recommendations", [])
        
        print(f"✓ Overall Drift Score: {overall_score:.3f}")
        print(f"✓ Overall Status: {overall_status}")
        print(f"✓ Alert Level: {alert_level}")
        print(f"✓ Recommendations ({len(recommendations)}):")
        for i, rec in enumerate(recommendations):
            print(f"  {i+1}. {rec}")
        
        return True
    except Exception as e:
        print(f"✗ Overall drift analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("=" * 70)
    print("DRIFT DETECTION ENDPOINT - TEST SUITE")
    print("=" * 70)
    
    tests = [
        ("Drift Calculation", test_drift_calculation),
        ("Create Chat Data", create_sample_chat_data),
        ("Create PHQ-9 Data", create_sample_phq9_data),
        ("Chat Drift Analysis", test_chat_drift),
        ("PHQ-9 Drift Analysis", test_phq9_drift),
        ("Overall Drift Analysis", test_overall_drift),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} test crashed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    all_pass = True
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} | {name}")
        all_pass = all_pass and result
    
    print("=" * 70)
    if all_pass:
        print("✓ ALL TESTS PASSED!")
        return 0
    else:
        print("✗ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    exit(main())
