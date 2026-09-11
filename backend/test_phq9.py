"""
Test script for PHQ-9 embedding and vector storage
"""

import sys
sys.path.insert(0, ".")

from embedding_service import embed_text
from vector_store import get_qdrant_client, initialize_collections, search_vectors, COLLECTION_PHQ9_VECTORS, upsert_vector
import uuid
import datetime

def test_phq9_embedding():
    """Test PHQ-9 assessment embedding and storage"""
    print("Testing PHQ-9 embedding and storage...")
    
    try:
        # Initialize collections
        initialize_collections()
        print("✓ Collections initialized")
        
        # Simulate multiple PHQ-9 assessments
        assessments = [
            {
                "name": "Assessment 1: Moderate Depression",
                "scores": [2, 2, 1, 2, 1, 2, 1, 0, 0],  # Total: 11 (Moderate)
                "student_id": "STU001"
            },
            {
                "name": "Assessment 2: Severe Depression",
                "scores": [3, 3, 2, 3, 2, 3, 3, 2, 1],  # Total: 22 (Severe)
                "student_id": "STU002"
            },
            {
                "name": "Assessment 3: Minimal Symptoms",
                "scores": [0, 0, 1, 0, 0, 1, 0, 0, 0],  # Total: 2 (Minimal)
                "student_id": "STU003"
            }
        ]
        
        PHQ9_QUESTIONS = [
            "Little interest or pleasure in doing things?",
            "Feeling down, depressed, or hopeless?",
            "Trouble falling or staying asleep, or sleeping too much?",
            "Feeling tired or having little energy?",
            "Poor appetite or overeating?",
            "Feeling bad about yourself—or that you are a failure or have let yourself or your family down?",
            "Trouble concentrating on things, such as reading the newspaper or watching television?",
            "Moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual?",
            "Thoughts that you would be better off dead, or of hurting yourself in some way?"
        ]
        
        SCORE_LABELS = ["Not at all", "Several days", "More than half the days", "Nearly every day"]
        
        stored_assessments = []
        
        for assessment in assessments:
            total_score = sum(assessment["scores"])
            
            # Determine severity
            if total_score <= 4:
                severity = "Minimal or None"
            elif total_score <= 9:
                severity = "Mild"
            elif total_score <= 14:
                severity = "Moderate"
            elif total_score <= 19:
                severity = "Moderately Severe"
            else:
                severity = "Severe"
            
            # Create text representation
            phq9_text_parts = []
            for i, score in enumerate(assessment["scores"]):
                if score > 0:
                    phq9_text_parts.append(f"{PHQ9_QUESTIONS[i]} - {SCORE_LABELS[score]}")
            
            phq9_text = "\n".join(phq9_text_parts) if phq9_text_parts else "All questions answered with minimal symptoms"
            
            # Generate embedding
            embedding = embed_text(phq9_text)
            
            # Store in Qdrant
            vector_id = upsert_vector(
                collection_name=COLLECTION_PHQ9_VECTORS,
                vector=embedding,
                payload={
                    "student_id": assessment["student_id"],
                    "scores": assessment["scores"],
                    "total_score": total_score,
                    "severity": severity,
                    "assessment_text": phq9_text
                }
            )
            
            stored_assessments.append({
                "name": assessment["name"],
                "vector_id": vector_id,
                "total_score": total_score,
                "severity": severity
            })
            
            print(f"✓ {assessment['name']}: Score {total_score}/27 ({severity})")
            print(f"  → Vector ID: {vector_id}")
        
        return stored_assessments
    
    except Exception as e:
        print(f"✗ PHQ-9 embedding test failed: {e}")
        raise


def test_phq9_search():
    """Test semantic search on PHQ-9 assessments"""
    print("\nTesting PHQ-9 semantic search...")
    
    try:
        # Search for assessments related to depression
        query_text = "feeling down depressed hopeless"
        query_embedding = embed_text(query_text)
        
        results = search_vectors(
            collection_name=COLLECTION_PHQ9_VECTORS,
            query_vector=query_embedding,
            limit=5
        )
        
        print(f"✓ Search for '{query_text}' returned {len(results)} results")
        for i, result in enumerate(results):
            score = result["score"]
            severity = result["payload"].get("severity", "Unknown")
            total_score = result["payload"].get("total_score", "N/A")
            student_id = result["payload"].get("student_id", "N/A")
            print(f"  {i+1}. Score: {score:.4f} | Severity: {severity} | Total: {total_score}/27 (Student: {student_id})")
        
    except Exception as e:
        print(f"✗ PHQ-9 search test failed: {e}")
        raise


def test_severity_trending():
    """Test trend analysis by severity"""
    print("\nTesting severity trending...")
    
    try:
        # Get all assessments
        client = get_qdrant_client()
        points = client.scroll(collection_name=COLLECTION_PHQ9_VECTORS, limit=100)[0]
        
        # Count by severity
        severity_counts = {}
        for point in points:
            severity = point.payload.get("severity", "Unknown")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        print("✓ Severity distribution:")
        for severity, count in sorted(severity_counts.items()):
            print(f"  - {severity}: {count} assessment(s)")
        
    except Exception as e:
        print(f"✗ Severity trending test failed: {e}")
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("PHQ-9 Embedding and Vector Storage Test")
    print("=" * 60)
    
    try:
        stored = test_phq9_embedding()
        test_phq9_search()
        test_severity_trending()
        
        print("\n" + "=" * 60)
        print("✓ All PHQ-9 tests passed!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ Test suite failed: {e}")
        sys.exit(1)
