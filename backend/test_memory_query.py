"""
Test script for Memory Query Endpoint - Hybrid Semantic Search
"""

import sys
sys.path.insert(0, ".")

import json
from embedding_service import embed_text
from vector_store import initialize_collections, upsert_vector, COLLECTION_CHAT_MEMORY, COLLECTION_PHQ9_VECTORS
from memory_service import (
    find_similar_chat_sessions,
    find_similar_assessments,
    cross_collection_search,
    query_similar_sessions
)

def print_section(title: str):
    """Print formatted section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def test_chat_memory_creation():
    """Create test chat session data"""
    print_section("STEP 1: Creating Test Chat Session Data")
    
    try:
        initialize_collections()
        
        # Create diverse chat messages
        sessions = [
            {
                "session_id": "session_001",
                "student_id": "student_001",
                "role": "user",
                "messages": [
                    "I've been struggling with anxiety attacks",
                    "They happen mostly in the morning",
                    "It's affecting my work performance"
                ],
                "mood": "negative"
            },
            {
                "session_id": "session_002",
                "student_id": "student_001",
                "role": "user",
                "messages": [
                    "Feeling overwhelmed by stress at work",
                    "Can't seem to focus on anything",
                    "Sleep has been terrible"
                ],
                "mood": "negative"
            },
            {
                "session_id": "session_003",
                "student_id": "student_001",
                "role": "user",
                "messages": [
                    "Had a great therapy session today",
                    "Learning new coping strategies",
                    "Feeling more hopeful"
                ],
                "mood": "positive"
            },
            {
                "session_id": "session_004",
                "student_id": "student_002",
                "role": "user",
                "messages": [
                    "Panic attacks are getting worse",
                    "Heart racing, can't breathe",
                    "Really scared"
                ],
                "mood": "critical"
            },
            {
                "session_id": "session_005",
                "student_id": "student_002",
                "role": "user",
                "messages": [
                    "Medication is helping a bit",
                    "Still having bad days",
                    "Trying to stay positive"
                ],
                "mood": "neutral"
            }
        ]
        
        total_stored = 0
        for session in sessions:
            for message in session["messages"]:
                embedding = embed_text(message)
                vector_id = upsert_vector(
                    collection_name=COLLECTION_CHAT_MEMORY,
                    vector=embedding,
                    payload={
                        "session_id": session["session_id"],
                        "student_id": session["student_id"],
                        "role": session["role"],
                        "content": message,
                        "mood": session["mood"]
                    }
                )
                total_stored += 1
                print(f"  ✓ Stored: '{message[:40]}...' -> {vector_id[:8]}...")
        
        print(f"\n✓ Created {len(sessions)} sessions with {total_stored} messages")
        return True
    
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_assessment_data_creation():
    """Create test PHQ-9 assessment data"""
    print_section("STEP 2: Creating Test PHQ-9 Assessment Data")
    
    try:
        initialize_collections()
        
        assessments = [
            {
                "student_id": "student_001",
                "scores": [0, 0, 1, 0, 0, 1, 0, 0, 0],
                "total_score": 2,
                "severity": "Minimal",
                "description": "Feeling good, minimal depression"
            },
            {
                "student_id": "student_001",
                "scores": [2, 2, 1, 2, 1, 2, 1, 0, 0],
                "total_score": 11,
                "severity": "Moderate",
                "description": "Moderate depression symptoms, struggling with focus"
            },
            {
                "student_id": "student_002",
                "scores": [3, 3, 2, 3, 2, 3, 2, 1, 1],
                "total_score": 20,
                "severity": "Moderately Severe",
                "description": "Severe anxiety and panic attacks"
            },
            {
                "student_id": "student_002",
                "scores": [2, 2, 2, 2, 1, 2, 2, 1, 0],
                "total_score": 14,
                "severity": "Moderate",
                "description": "Improving with treatment, fewer panic episodes"
            }
        ]
        
        for i, assessment in enumerate(assessments, 1):
            embedding = embed_text(assessment["description"])
            vector_id = upsert_vector(
                collection_name=COLLECTION_PHQ9_VECTORS,
                vector=embedding,
                payload={
                    "student_id": assessment["student_id"],
                    "scores": assessment["scores"],
                    "total_score": assessment["total_score"],
                    "severity": assessment["severity"],
                    "assessment_text": assessment["description"]
                }
            )
            print(f"  ✓ Assessment {i}: Score {assessment['total_score']}/27 ({assessment['severity']}) -> {vector_id[:8]}...")
        
        print(f"\n✓ Created {len(assessments)} PHQ-9 assessments")
        return True
    
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_chat_similarity_search():
    """Test finding similar chat sessions"""
    print_section("STEP 3: Testing Chat Similarity Search")
    
    try:
        query = "I'm having trouble with anxiety and panic"
        print(f"Query: '{query}'")
        
        result = find_similar_chat_sessions(
            message=query,
            student_id="student_001",
            limit=3
        )
        
        print(f"\nStatus: {result['status']}")
        print(f"Results found: {result['total_found']}")
        
        for i, session in enumerate(result.get("results", []), 1):
            print(f"\n  Result {i}:")
            print(f"    Score: {session['similarity_score']:.3f}")
            print(f"    Content: {session.get('content', '')[:50]}...")
            print(f"    Session: {session['session_id']}")
            print(f"    Student: {session['student_id']}")
        
        return result['status'] == 'success' and result['total_found'] > 0
    
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_assessment_similarity_search():
    """Test finding similar assessments"""
    print_section("STEP 4: Testing Assessment Similarity Search")
    
    try:
        query = "Experiencing depression symptoms and panic attacks"
        print(f"Query: '{query}'")
        
        result = find_similar_assessments(
            assessment_text=query,
            student_id="student_002",
            limit=2
        )
        
        print(f"\nStatus: {result['status']}")
        print(f"Results found: {result['total_found']}")
        
        for i, assessment in enumerate(result.get("results", []), 1):
            print(f"\n  Result {i}:")
            print(f"    Score: {assessment['similarity_score']:.3f}")
            print(f"    Total Score: {assessment.get('total_score', 'N/A')}/27")
            print(f"    Severity: {assessment.get('severity', 'Unknown')}")
            print(f"    Content: {assessment.get('content', '')[:50]}...")
        
        return result['status'] == 'success' and result['total_found'] > 0
    
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_cross_collection_search():
    """Test hybrid search across both collections"""
    print_section("STEP 5: Testing Cross-Collection (Hybrid) Search")
    
    try:
        query = "Anxiety and depression making it hard to function"
        print(f"Query: '{query}'")
        
        result = cross_collection_search(
            query_text=query,
            limit=2
        )
        
        print(f"\nStatus: {result['status']}")
        print(f"Total results: {result.get('total_results', 0)}")
        
        chat_results = result.get("chat_sessions", [])
        print(f"\n📝 Chat Sessions Found: {len(chat_results)}")
        for i, session in enumerate(chat_results, 1):
            print(f"  {i}. {session.get('content', '')[:50]}... (score: {session.get('similarity_score', 0):.3f})")
        
        assessment_results = result.get("assessments", [])
        print(f"\n📊 Assessments Found: {len(assessment_results)}")
        for i, assessment in enumerate(assessment_results, 1):
            print(f"  {i}. {assessment.get('severity', 'Unknown')} (score: {assessment.get('similarity_score', 0):.3f})")
        
        return result['status'] == 'success'
    
    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_student_filter():
    """Test searching with student ID filter"""
    print_section("STEP 6: Testing Student Filter")
    
    try:
        query = "panic and anxiety"
        
        print(f"Query: '{query}' (filtered to student_002)")
        result = query_similar_sessions(
            query_text=query,
            student_id="student_002",
            limit=5
        )
        
        print(f"\nStatus: {result['status']}")
        print(f"Results found: {result['total_found']}")
        
        # Verify all results are from student_002
        all_correct_student = all(
            r.get("student_id") == "student_002"
            for r in result.get("results", [])
        )
        
        if all_correct_student:
            print("✓ All results correctly filtered to student_002")
        else:
            print("✗ Found results from other students!")
        
        for i, session in enumerate(result.get("results", []), 1):
            print(f"  {i}. Student: {session['student_id']}, Score: {session['similarity_score']:.3f}")
        
        return result['status'] == 'success' and all_correct_student
    
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_score_threshold():
    """Test with different similarity thresholds"""
    print_section("STEP 7: Testing Score Threshold Filtering")
    
    try:
        query = "feeling sad and depressed"
        
        print(f"Query: '{query}'")
        print(f"Testing with high threshold (0.6)...")
        
        result_high = query_similar_sessions(
            query_text=query,
            score_threshold=0.6,
            limit=10
        )
        
        result_low = query_similar_sessions(
            query_text=query,
            score_threshold=0.2,
            limit=10
        )
        
        print(f"\n  High threshold (0.6): {result_high['total_found']} results")
        print(f"  Low threshold (0.2): {result_low['total_found']} results")
        
        if result_high['total_found'] <= result_low['total_found']:
            print("✓ Threshold filtering working correctly")
            return True
        else:
            print("✗ Threshold not working as expected")
            return False
    
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def main():
    print("="*70)
    print("MEMORY QUERY ENDPOINT - HYBRID SEMANTIC SEARCH TEST SUITE")
    print("="*70)
    
    tests = [
        ("Create Chat Data", test_chat_memory_creation),
        ("Create Assessment Data", test_assessment_data_creation),
        ("Chat Similarity Search", test_chat_similarity_search),
        ("Assessment Similarity Search", test_assessment_similarity_search),
        ("Cross-Collection Search", test_cross_collection_search),
        ("Student Filter", test_student_filter),
        ("Score Threshold", test_score_threshold),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} crashed: {e}")
            results.append((name, False))
    
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    all_pass = True
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} | {name}")
        all_pass = all_pass and result
    
    print("="*70)
    if all_pass:
        print("✅ ALL TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    exit(main())
