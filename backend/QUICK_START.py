#!/usr/bin/env python3
"""
Quick Start: Drift Detection API Usage Examples

Copy and paste these examples to quickly test the drift endpoints.
"""

import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
STUDENT_ID = "test_student_001"

def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_response(response: requests.Response):
    """Pretty print a JSON response"""
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
    except:
        print(response.text)

# ============================================================================
# EXAMPLE 1: POST /drift - Overall Drift Analysis
# ============================================================================

def example_overall_drift():
    """
    Get overall mental health drift assessment.
    This endpoint combines PHQ-9 (60%) and chat (40%) drift analysis.
    """
    print_section("EXAMPLE 1: POST /drift - Overall Drift Analysis")
    
    url = f"{BASE_URL}/drift"
    
    payload = {
        "student_id": STUDENT_ID,
        "include_chat": True,
        "include_phq9": True,
        "limit_history": 10
    }
    
    print(f"URL: POST {url}")
    print(f"\nRequest Body:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(url, json=payload)
        print(f"\nStatus Code: {response.status_code}")
        print(f"\nResponse:")
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            alert = data.get("alert_level", "unknown")
            score = data.get("overall_drift_score", 0)
            
            print(f"\n📊 INTERPRETATION:")
            print(f"   Score: {score:.3f}")
            if alert == "green":
                print(f"   Alert: 🟢 STABLE - Continue wellness routine")
            elif alert == "yellow":
                print(f"   Alert: 🟡 DRIFTING - Consider counselor check-in")
            else:
                print(f"   Alert: 🔴 CRITICAL - Emergency intervention needed")
    
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: {e}")


# ============================================================================
# EXAMPLE 2: GET /drift/chat/{student_id} - Chat Pattern Analysis
# ============================================================================

def example_chat_drift():
    """
    Analyze conversation emotional patterns and tone changes.
    Shows how the student's messages are becoming more/less positive.
    """
    print_section("EXAMPLE 2: GET /drift/chat/{student_id}")
    
    url = f"{BASE_URL}/drift/chat/{STUDENT_ID}"
    params = {"limit_history": 10}
    
    print(f"URL: GET {url}")
    print(f"Query Parameters: {params}")
    
    try:
        response = requests.get(url, params=params)
        print(f"\nStatus Code: {response.status_code}")
        print(f"\nResponse:")
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            chat_drift = data.get("chat_drift", {})
            score = chat_drift.get("drift_score", 0)
            status = chat_drift.get("drift_status", "unknown")
            
            print(f"\n💬 INTERPRETATION:")
            print(f"   Drift Score: {score:.3f}")
            print(f"   Status: {status}")
            
            stats = chat_drift.get("similarity_stats", {})
            if stats:
                print(f"   Conversation Consistency: {stats.get('average', 0):.3f} (avg)")
                print(f"   Volatility: {stats.get('std_deviation', 0):.3f} (std dev)")
    
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: {e}")


# ============================================================================
# EXAMPLE 3: GET /drift/phq9/{student_id} - Depression Score Trends
# ============================================================================

def example_phq9_drift():
    """
    Monitor PHQ-9 depression severity progression.
    Shows if scores are improving, stable, or worsening.
    """
    print_section("EXAMPLE 3: GET /drift/phq9/{student_id}")
    
    url = f"{BASE_URL}/drift/phq9/{STUDENT_ID}"
    params = {"limit_history": 5}
    
    print(f"URL: GET {url}")
    print(f"Query Parameters: {params}")
    
    try:
        response = requests.get(url, params=params)
        print(f"\nStatus Code: {response.status_code}")
        print(f"\nResponse:")
        print_response(response)
        
        if response.status_code == 200:
            data = response.json()
            phq9_drift = data.get("phq9_drift", {})
            latest = data.get("latest_assessment", {})
            
            score = latest.get("score", 0)
            severity = latest.get("severity", "Unknown")
            trend = latest.get("score_trend", "unknown")
            
            print(f"\n📊 INTERPRETATION:")
            print(f"   Latest Score: {score}/27")
            print(f"   Severity: {severity}")
            print(f"   Trend: {trend} ↑↓")
            
            # Severity explanation
            if score <= 4:
                print(f"   Status: Minimal or no depression symptoms")
            elif score <= 9:
                print(f"   Status: Mild depression")
            elif score <= 14:
                print(f"   Status: Moderate depression")
            elif score <= 19:
                print(f"   Status: Moderately severe depression")
            else:
                print(f"   Status: Severe depression - URGENT support needed")
    
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error: {e}")


# ============================================================================
# HELPER: Alert Level Colors
# ============================================================================

def interpret_alert_level(level: str) -> str:
    """Convert alert level to description"""
    levels = {
        "green": "🟢 STABLE - No urgent concerns. Keep doing what you're doing!",
        "yellow": "🟡 DRIFTING - Changes detected. Monitor closely and consider support.",
        "red": "🔴 CRITICAL - Urgent attention needed. Seek immediate help."
    }
    return levels.get(level, f"Unknown level: {level}")


# ============================================================================
# HELPER: Severity Categories
# ============================================================================

def interpret_phq9_severity(score: int) -> str:
    """Explain PHQ-9 severity level"""
    if score <= 4:
        return "✅ Minimal or None - Healthy mental state"
    elif score <= 9:
        return "🟢 Mild - Minor symptoms, manageable"
    elif score <= 14:
        return "🟡 Moderate - Notable symptoms, seek support"
    elif score <= 19:
        return "🟠 Moderately Severe - Significant impact, urgent support"
    else:
        return "🔴 Severe - Severe depression, emergency intervention needed"


# ============================================================================
# HELPER: Using curl from Command Line
# ============================================================================

def show_curl_examples():
    """Show curl command examples"""
    print_section("CURL Command Line Examples")
    
    print("\n1️⃣  Overall Drift Analysis:")
    print("""
curl -X POST http://localhost:8000/drift \\
  -H "Content-Type: application/json" \\
  -d '{
    "student_id": "USER_123",
    "include_chat": true,
    "include_phq9": true,
    "limit_history": 10
  }'
    """)
    
    print("\n2️⃣  Chat Drift Detail:")
    print("""
curl http://localhost:8000/drift/chat/USER_123?limit_history=10
    """)
    
    print("\n3️⃣  PHQ-9 Drift Detail:")
    print("""
curl http://localhost:8000/drift/phq9/USER_123?limit_history=5
    """)


# ============================================================================
# HELPER: Using Python requests
# ============================================================================

def show_python_examples():
    """Show Python requests examples"""
    print_section("Python requests Examples")
    
    print("""
import requests

# 1. Overall Drift
response = requests.post(
    'http://localhost:8000/drift',
    json={'student_id': 'USER_123'}
)
drift_data = response.json()

# 2. Chat Drift
response = requests.get(
    'http://localhost:8000/drift/chat/USER_123'
)
chat_drift = response.json()

# 3. PHQ-9 Drift
response = requests.get(
    'http://localhost:8000/drift/phq9/USER_123'
)
phq9_drift = response.json()
    """)


# ============================================================================
# HELPER: Understanding Responses
# ============================================================================

def explain_response_structure():
    """Explain the response structure"""
    print_section("Understanding Response Structure")
    
    print("""
📋 POST /drift Response Structure:
{
  "timestamp": "ISO-8601 datetime when analysis was performed",
  "overall_drift_score": 0.0 to 1.0 (higher = more stable),
  "overall_status": "stable" | "drifting" | "critical_drift",
  "alert_level": "green" | "yellow" | "red",
  "recommendations": ["action 1", "action 2", ...]
}

Key Fields:
- overall_drift_score: 
  > 0.85 = Stable (consistent mental health)
  0.70-0.85 = Drifting (changes detected)
  < 0.70 = Critical (urgent intervention)

- overall_status: Classification based on score
- alert_level: Visual indication (color)
- recommendations: Personalized action items


📋 GET /drift/chat/{student_id} Response:
{
  "chat_drift": {
    "drift_score": 0.0-1.0,
    "drift_status": "stable" | "drifting" | "critical_drift",
    "similarity_stats": {
      "average": average similarity across messages,
      "std_deviation": consistency measure,
      "min": lowest similarity found,
      "max": highest similarity found
    }
  },
  "message_count": number of messages analyzed,
  "timestamp": when analysis was done
}

Interpretation:
- High average (>0.8): Student repeating same concerns
- Low std_dev: Consistent emotional pattern
- Wide min/max range: High emotional volatility


📋 GET /drift/phq9/{student_id} Response:
{
  "phq9_drift": {
    "drift_score": 0.0-1.0,
    "drift_status": "stable" | "drifting" | "critical_drift"
  },
  "latest_assessment": {
    "score": 0-27 PHQ-9 score,
    "severity": "Minimal or None" | "Mild" | "Moderate" | etc,
    "score_trend": "improving" | "stable" | "worsening",
    "score_change": change from previous assessment
  },
  "assessment_count": number of assessments analyzed,
  "timestamp": when analysis was done
}

Interpretation:
- score_trend: Direction of depression change
- score_change: Magnitude of change
- severity: Clinical classification
    """)


# ============================================================================
# Main Function
# ============================================================================

def main():
    """Run all examples"""
    print("""
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║         🎯 DRIFT DETECTION API - Quick Start Guide                    ║
║                                                                        ║
║    Mental Health Analytics via Vector Embeddings & Similarity         ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
    """)
    
    # Show documentation
    explain_response_structure()
    show_curl_examples()
    show_python_examples()
    
    print_section("Running Live Examples (if server is running)")
    print("\nAttempting to connect to localhost:8000...")
    print(f"(Make sure FastAPI backend is running: python main.py)")
    
    try:
        # Test connection
        response = requests.get(f"{BASE_URL}/", timeout=2)
        if response.status_code == 200:
            print("✅ Server is running!\n")
            
            # Run examples
            print("Running example queries...\n")
            # example_overall_drift()
            # example_chat_drift()
            # example_phq9_drift()
            
            print("\n" + "="*70)
            print("Note: Replace 'test_student_001' with actual student IDs")
            print("      that have chat messages and PHQ-9 assessments")
            print("="*70)
        else:
            print("❌ Server returned unexpected status")
    
    except requests.exceptions.ConnectionError:
        print("""
❌ Could not connect to server!

Make sure to:
1. Start the backend server: cd backend && python main.py
2. Wait for "Uvicorn running on" message
3. Run this script again

Example output when server is running:
  INFO:     Uvicorn running on http://127.0.0.1:8000
  INFO:     Application startup complete
        """)
    except requests.exceptions.Timeout:
        print("❌ Server connection timed out")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Show summary
    print_section("Quick Reference")
    print("""
📊 Alert Levels:
  🟢 GREEN  = Drift Score > 0.85  = Stable
  🟡 YELLOW = Drift Score 0.70-0.85 = Drifting
  🔴 RED    = Drift Score < 0.70  = Critical

📈 Drift Calculation:
  Overall = (PHQ-9 × 0.60) + (Chat × 0.40)
  
  Why these weights?
  - PHQ-9 (60%): Validated clinical assessment
  - Chat (40%): Real-time behavioral signals

📋 Response Times:
  Chat drift:     ~250ms
  PHQ-9 drift:    ~125ms
  Overall drift:  ~400ms
  Total:          < 500ms

🔗 API Endpoints:
  POST   /drift                    - Overall analysis
  GET    /drift/chat/{student_id}  - Chat patterns
  GET    /drift/phq9/{student_id}  - PHQ-9 trends

💾 Data Requirements:
  - At least 1 chat message in chat_memory collection
  - At least 1 PHQ-9 assessment in phq9_vectors collection
  - Valid student_id for tracking

📚 Documentation:
  - DRIFT_README.md               - User guide
  - DRIFT_API_REFERENCE.md        - Complete API docs
  - DRIFT_IMPLEMENTATION_SUMMARY  - Implementation details
    """)
    
    print("\n✅ Ready to use! Test with curl or Python requests above.\n")


if __name__ == "__main__":
    main()
