#!/usr/bin/env python3
import requests
import json
import sys

BASE_URL = "http://localhost:5001"

def test_chat_crisis():
    print("\n" + "="*70)
    print("TEST 1: /chat with Clear Self-Harm Ideation")
    print("="*70)
    
    test_message = "I can't take this pain anymore, I want to end my life and kill myself tonight."
    payload = {
        "message": test_message,
        "session_id": "test-crisis-session-001",
        "user_id": "test-user-001"
    }
    
    print(f"👉 Input Message: \"{test_message}\"")
    res = requests.post(f"{BASE_URL}/chat", json=payload, timeout=15)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    
    data = res.json()
    reply = data.get("data", {}).get("reply", "")
    drift_state = data.get("drift_state")
    actions = data.get("actions", [])
    
    print(f"\n📩 Actual Response Received:")
    print(reply)
    print(f"\n🌊 Drift State: {drift_state}")
    print(f"⚡ Actions ({len(actions)}):")
    for act in actions:
        print(f"   - Type: {act.get('type')}, Target: {act.get('target')}, Priority: {act.get('priority')}")
        if act.get('details'):
            print(f"     Details: {act.get('details')}")
    
    assert "14416" in reply, "FAIL: Response does not include Tele-MANAS 14416"
    assert "1800-599-0019" in reply, "FAIL: Response does not include KIRAN 1800-599-0019"
    assert drift_state in ["critical", "high_risk"], f"FAIL: Drift state expected critical, got {drift_state}"
    
    has_emergency_action = any(a.get("type") in ["emergency", "EMERGENCY"] or a.get("target") == "crisis_team" for a in actions)
    assert has_emergency_action, "FAIL: Actions does not contain emergency action targeting crisis_team"
    print("\n✅ TEST 1 PASSED: Helpline numbers and emergency action verified!")
    return reply

def test_phq9_question9():
    print("\n" + "="*70)
    print("TEST 2: /phq9 with Low Total Score but Question 9 Flagged (Self-Harm)")
    print("="*70)
    
    # Scores: [0, 0, 0, 0, 0, 0, 0, 0, 2] -> Total = 2 (Minimal), but Question 9 = 2
    scores = [0, 0, 0, 0, 0, 0, 0, 0, 2]
    payload = {
        "scores": scores,
        "student_id": "test-student-q9"
    }
    
    print(f"👉 PHQ-9 Scores: {scores} (Question 9 = 2, thoughts of hurting oneself)")
    res = requests.post(f"{BASE_URL}/phq9", json=payload, timeout=15)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    
    data = res.json()
    drift_state = data.get("drift_state")
    actions = data.get("actions", [])
    recommendations = data.get("data", {}).get("recommendations", [])
    severity = data.get("data", {}).get("severity")
    
    print(f"Severity: {severity}")
    print(f"🌊 Drift State: {drift_state}")
    print(f"📋 Recommendations: {recommendations}")
    print(f"⚡ Actions ({len(actions)}):")
    for act in actions:
        print(f"   - Type: {act.get('type')}, Target: {act.get('target')}, Priority: {act.get('priority')}")
        if act.get('details'):
            print(f"     Details: {act.get('details')}")
            
    assert drift_state in ["critical", "CRITICAL"], f"FAIL: Expected critical drift state for Question 9, got {drift_state}"
    assert "14416" in recommendations[0], "FAIL: Recommendation missing Tele-MANAS 14416"
    assert "1800-599-0019" in recommendations[0], "FAIL: Recommendation missing KIRAN 1800-599-0019"
    has_emergency_action = any(a.get("type") in ["emergency", "EMERGENCY"] for a in actions)
    assert has_emergency_action, "FAIL: Expected create_emergency_action on Question 9 endorsement"
    print("\n✅ TEST 2 PASSED: PHQ-9 Question 9 clinical override verified!")

if __name__ == "__main__":
    try:
        reply = test_chat_crisis()
        test_phq9_question9()
        print("\n" + "="*70)
        print("🎯 ALL BACKEND CRISIS PIPELINE TESTS PASSED 100%!")
        print("="*70)
    except Exception as e:
        print(f"\n❌ TEST FAILURE: {e}")
        sys.exit(1)
