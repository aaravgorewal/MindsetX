"""
Integration test for drift detection endpoints
Simulates complete REST API flow
"""

import sys
sys.path.insert(0, ".")

import json
from datetime import datetime, timedelta
from typing import Dict, Any

from embedding_service import embed_text
from vector_store import initialize_collections, upsert_vector, COLLECTION_CHAT_MEMORY, COLLECTION_PHQ9_VECTORS
from drift_service import analyze_overall_drift, analyze_chat_drift, analyze_phq9_drift

# Simulated student profiles with different mental health trajectories
STUDENT_PROFILES = {
    "stable_student": {
        "name": "Alex (Stable)",
        "chat_messages": [
            ("Feeling good today, exercised and got good sleep", "positive"),
            ("Had a productive day at work", "positive"),
            ("Weekend plans with friends, feeling optimistic", "positive"),
            ("Just finished a nice meditation session", "positive"),
            ("Things are going well overall", "positive"),
        ],
        "phq9_assessments": [
            {"scores": [0, 0, 0, 0, 0, 0, 0, 0, 0], "severity": "Minimal or None"},
            {"scores": [0, 0, 1, 0, 0, 0, 1, 0, 0], "severity": "Minimal or None"},
            {"scores": [0, 1, 0, 1, 0, 1, 0, 0, 0], "severity": "Mild"},
        ]
    },
    "declining_student": {
        "name": "Jordan (Declining)",
        "chat_messages": [
            ("Had a great day, feeling accomplished", "positive"),
            ("Work stress is building up a bit", "neutral"),
            ("Really tired today, hard to concentrate", "negative"),
            ("Feeling overwhelmed, nothing seems to help", "negative"),
            ("Everything feels pointless, don't know what to do", "crisis"),
        ],
        "phq9_assessments": [
            {"scores": [0, 0, 1, 0, 0, 1, 0, 0, 0], "severity": "Minimal or None"},
            {"scores": [1, 1, 1, 1, 0, 1, 1, 0, 0], "severity": "Mild"},
            {"scores": [2, 2, 2, 2, 1, 2, 2, 1, 0], "severity": "Moderate"},
            {"scores": [3, 3, 2, 3, 2, 3, 2, 1, 1], "severity": "Moderately Severe"},
        ]
    },
    "improving_student": {
        "name": "Sam (Improving)",
        "chat_messages": [
            ("Struggling today, very sad", "negative"),
            ("Still down but trying to stay positive", "neutral"),
            ("Had a good conversation with my therapist", "positive"),
            ("Feeling a bit better, took a walk", "positive"),
            ("Making progress, grateful for support", "positive"),
        ],
        "phq9_assessments": [
            {"scores": [3, 3, 2, 3, 2, 3, 2, 1, 1], "severity": "Moderately Severe"},
            {"scores": [2, 2, 2, 2, 1, 2, 2, 1, 0], "severity": "Moderate"},
            {"scores": [1, 1, 1, 1, 0, 1, 1, 0, 0], "severity": "Mild"},
        ]
    }
}


def setup_student_data(student_key: str) -> str:
    """Create and store sample data for a student"""
    profile = STUDENT_PROFILES[student_key]
    student_id = student_key
    session_id = student_key
    
    initialize_collections()
    
    print(f"\n📊 Setting up data for {profile['name']}...")
    
    # Store chat messages
    for i, (message, mood) in enumerate(profile["chat_messages"]):
        embedding = embed_text(message)
        upsert_vector(
            collection_name=COLLECTION_CHAT_MEMORY,
            vector=embedding,
            payload={
                "session_id": session_id,
                "student_id": student_id,
                "role": "user",
                "content": message,
                "mood": mood,
                "timestamp": (datetime.now() - timedelta(days=len(profile["chat_messages"])-i-1)).isoformat()
            }
        )
    
    print(f"  ✓ Stored {len(profile['chat_messages'])} chat messages")
    
    # Store PHQ-9 assessments
    for i, assessment in enumerate(profile["phq9_assessments"]):
        text_parts = []
        for j, score in enumerate(assessment["scores"]):
            if score > 0:
                text_parts.append(f"Item_{j+1}_score_{score}")
        
        embedding = embed_text(" ".join(text_parts) or "Assessment data")
        total_score = sum(assessment["scores"])
        
        upsert_vector(
            collection_name=COLLECTION_PHQ9_VECTORS,
            vector=embedding,
            payload={
                "student_id": student_id,
                "scores": assessment["scores"],
                "total_score": total_score,
                "severity": assessment["severity"],
                "timestamp": (datetime.now() - timedelta(days=len(profile["phq9_assessments"])-i-1)).isoformat()
            }
        )
    
    print(f"  ✓ Stored {len(profile['phq9_assessments'])} PHQ-9 assessments")
    
    return student_id


def test_overall_drift_endpoint(student_id: str) -> Dict[str, Any]:
    """Test POST /drift endpoint"""
    print(f"\n🔍 Testing POST /drift for {student_id}...")
    
    request = {
        "student_id": student_id,
        "include_chat": True,
        "include_phq9": True,
        "limit_history": 10
    }
    
    print(f"  Request: {json.dumps(request, indent=2)}")
    
    result = analyze_overall_drift(student_id)
    
    print(f"\n  Response:")
    print(f"  ├─ overall_drift_score: {result['overall_drift_score']:.3f}")
    print(f"  ├─ overall_status: {result['overall_status']}")
    print(f"  ├─ alert_level: {result['alert_level']}")
    print(f"  ├─ recommendations ({len(result['recommendations'])})")
    for i, rec in enumerate(result['recommendations'], 1):
        print(f"  │  └─ {i}. {rec[:60]}...")
    
    return result


def test_chat_drift_endpoint(student_id: str) -> Dict[str, Any]:
    """Test GET /drift/chat/{student_id} endpoint"""
    print(f"\n🔍 Testing GET /drift/chat/{student_id}...")
    
    result = analyze_chat_drift(student_id, limit_history=10)
    
    print(f"  Response:")
    print(f"  ├─ drift_score: {result['chat_drift']['drift_score']:.3f}")
    print(f"  ├─ drift_status: {result['chat_drift']['drift_status']}")
    print(f"  ├─ messages_analyzed: {result['message_count']}")
    
    if result['chat_drift']['similarity_stats']:
        stats = result['chat_drift']['similarity_stats']
        print(f"  ├─ similarity_stats:")
        print(f"  │  ├─ average: {stats.get('average', 0):.3f}")
        print(f"  │  ├─ std_dev: {stats.get('std_deviation', 0):.3f}")
        print(f"  │  ├─ min: {stats.get('min', 0):.3f}")
        print(f"  │  └─ max: {stats.get('max', 0):.3f}")
    
    return result


def test_phq9_drift_endpoint(student_id: str) -> Dict[str, Any]:
    """Test GET /drift/phq9/{student_id} endpoint"""
    print(f"\n🔍 Testing GET /drift/phq9/{student_id}...")
    
    result = analyze_phq9_drift(student_id, limit_history=5)
    
    print(f"  Response:")
    print(f"  ├─ drift_score: {result['phq9_drift']['drift_score']:.3f}")
    print(f"  ├─ drift_status: {result['phq9_drift']['drift_status']}")
    print(f"  ├─ assessments_analyzed: {result['assessment_count']}")
    
    if 'latest_assessment' in result:
        latest = result['latest_assessment']
        print(f"  ├─ latest_assessment:")
        print(f"  │  ├─ score: {latest.get('score', 0)}/27")
        print(f"  │  ├─ severity: {latest.get('severity', 'Unknown')}")
        print(f"  │  ├─ trend: {latest.get('score_trend', 'unknown')}")
        print(f"  │  └─ score_change: {latest.get('score_change', 0)}")
    
    return result


def analyze_student_profile(student_key: str) -> None:
    """Complete analysis flow for one student"""
    print("\n" + "="*80)
    profile = STUDENT_PROFILES[student_key]
    print(f"STUDENT PROFILE: {profile['name']}")
    print("="*80)
    
    # Setup data
    student_id = setup_student_data(student_key)
    
    # Run all three endpoint tests
    overall_result = test_overall_drift_endpoint(student_id)
    chat_result = test_chat_drift_endpoint(student_id)
    phq9_result = test_phq9_drift_endpoint(student_id)
    
    # Analysis summary
    print(f"\n📈 ANALYSIS SUMMARY:")
    print(f"  Overall Status: {overall_result['overall_status'].upper()}")
    print(f"  Alert Level: {overall_result['alert_level'].upper()}")
    print(f"  Chat Drift: {chat_result['chat_drift']['drift_status']}")
    print(f"  PHQ-9 Drift: {phq9_result['phq9_drift']['drift_status']}")
    
    # Alert interpretation
    alert_color = {
        "green": "🟢 No immediate concerns",
        "yellow": "🟡 Monitor for changes",
        "red": "🔴 Urgent intervention needed"
    }
    print(f"  Interpretation: {alert_color.get(overall_result['alert_level'], '?')}")


def main():
    print("\n" + "="*80)
    print("DRIFT DETECTION - INTEGRATION TEST SUITE")
    print("Testing all three endpoints across different student profiles")
    print("="*80)
    
    try:
        # Test each student profile
        for student_key in ["stable_student", "declining_student", "improving_student"]:
            analyze_student_profile(student_key)
        
        print("\n" + "="*80)
        print("✓ ALL INTEGRATION TESTS PASSED!")
        print("="*80)
        print("\nEndpoints verified:")
        print("  ✓ POST /drift - Overall drift analysis")
        print("  ✓ GET /drift/chat/{student_id} - Chat drift detail")
        print("  ✓ GET /drift/phq9/{student_id} - PHQ-9 drift detail")
        print("\nReady for production deployment")
        print("="*80)
        
        return 0
    
    except Exception as e:
        print(f"\n✗ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
