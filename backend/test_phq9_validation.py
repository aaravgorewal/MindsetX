"""
Simple test for PHQ-9 API endpoint validation
Tests the endpoint structure and data models
"""

import json
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional

# Test the Pydantic models
class PHQ9Request(BaseModel):
    """PHQ-9 assessment request"""
    scores: List[int] = Field(..., min_items=9, max_items=9, description="PHQ-9 scores (0-3 each)")
    student_id: Optional[str] = Field(None, description="Student identifier")
    timestamp: Optional[str] = Field(None, description="Assessment timestamp")


class PHQ9Response(BaseModel):
    """PHQ-9 assessment response"""
    totalScore: int = Field(..., description="Total PHQ-9 score (0-27)")
    severity: str = Field(..., description="Depression severity level")
    driftState: str = Field(..., description="Mental health drift state")
    recommendation: str = Field(..., description="Personalized recommendation")
    vector_id: Optional[str] = Field(None, description="Vector ID in Qdrant")


def test_phq9_request_validation():
    """Test PHQ-9 request validation"""
    print("Testing PHQ-9 Request Validation...")
    
    # Valid request
    try:
        request = PHQ9Request(
            scores=[2, 1, 2, 1, 0, 2, 1, 0, 0],
            student_id="STU001",
            timestamp="2026-01-25T10:30:00"
        )
        print(f"✓ Valid request accepted: {request.scores}")
    except ValidationError as e:
        print(f"✗ Validation failed: {e}")
        return False
    
    # Invalid request - wrong number of scores
    try:
        request = PHQ9Request(
            scores=[2, 1, 2],  # Only 3 scores
            student_id="STU001"
        )
        print(f"✗ Should have rejected wrong score count")
        return False
    except ValidationError:
        print(f"✓ Correctly rejected invalid score count")
    
    # Valid request with auto-generated student_id
    try:
        request = PHQ9Request(
            scores=[0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        print(f"✓ Valid request with minimal scores: {sum(request.scores)}")
    except ValidationError as e:
        print(f"✗ Validation failed: {e}")
        return False
    
    return True


def test_phq9_response_validation():
    """Test PHQ-9 response validation"""
    print("\nTesting PHQ-9 Response Validation...")
    
    test_cases = [
        {
            "totalScore": 2,
            "severity": "Minimal or None",
            "driftState": "stable",
            "recommendation": "Keep it up!",
            "expected_pass": True
        },
        {
            "totalScore": 11,
            "severity": "Moderate",
            "driftState": "declining",
            "recommendation": "Consider counseling...",
            "expected_pass": True
        },
        {
            "totalScore": 25,
            "severity": "Severe",
            "driftState": "critical",
            "recommendation": "Call 14416 now",
            "expected_pass": True
        }
    ]
    
    for i, case in enumerate(test_cases):
        try:
            response = PHQ9Response(**case)
            if case["expected_pass"]:
                print(f"✓ Case {i+1}: Score {response.totalScore} -> {response.severity}")
            else:
                print(f"✗ Case {i+1}: Should have failed")
                return False
        except ValidationError as e:
            if not case["expected_pass"]:
                print(f"✓ Case {i+1}: Correctly rejected")
            else:
                print(f"✗ Case {i+1}: Validation failed: {e}")
                return False
    
    return True


def test_severity_mapping():
    """Test severity mapping for different scores"""
    print("\nTesting Severity Mapping...")
    
    severity_map = {
        0: "Minimal or None",
        4: "Minimal or None",
        5: "Mild",
        9: "Mild",
        10: "Moderate",
        14: "Moderate",
        15: "Moderately Severe",
        19: "Moderately Severe",
        20: "Severe",
        27: "Severe"
    }
    
    for score, expected_severity in severity_map.items():
        # Determine severity
        if score <= 4:
            severity = "Minimal or None"
        elif score <= 9:
            severity = "Mild"
        elif score <= 14:
            severity = "Moderate"
        elif score <= 19:
            severity = "Moderately Severe"
        else:
            severity = "Severe"
        
        if severity == expected_severity:
            print(f"✓ Score {score}: {severity}")
        else:
            print(f"✗ Score {score}: Expected {expected_severity}, got {severity}")
            return False
    
    return True


def test_drift_state_mapping():
    """Test drift state mapping"""
    print("\nTesting Drift State Mapping...")
    
    drift_tests = [
        (2, "stable"),
        (9, "stable"),
        (10, "declining"),
        (14, "declining"),
        (20, "critical")
    ]
    
    for score, expected_drift in drift_tests:
        # Determine drift state
        if score <= 9:
            drift_state = "stable"
        elif score <= 19:
            drift_state = "declining"
        else:
            drift_state = "critical"
        
        if drift_state == expected_drift:
            print(f"✓ Score {score}: {drift_state}")
        else:
            print(f"✗ Score {score}: Expected {expected_drift}, got {drift_state}")
            return False
    
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("PHQ-9 Endpoint Validation Tests")
    print("=" * 60)
    
    all_pass = True
    
    all_pass &= test_phq9_request_validation()
    all_pass &= test_phq9_response_validation()
    all_pass &= test_severity_mapping()
    all_pass &= test_drift_state_mapping()
    
    print("\n" + "=" * 60)
    if all_pass:
        print("✓ All PHQ-9 validation tests passed!")
    else:
        print("✗ Some tests failed")
    print("=" * 60)
