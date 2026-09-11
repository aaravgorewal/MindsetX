# MAS Orchestrator Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Multi-Agent System (MAS) Orchestrator endpoint (`/mas/execute`).

---

## Test Environment Setup

### Prerequisites
- Backend server running on `http://localhost:8000`
- Qdrant database connected and initialized
- All collections populated with test data
- Postman or cURL installed

### Test Data Seeding

Before running tests, ensure test data exists:

```python
# See backend for proper data seeding
# At minimum, ensure:
# 1. Test student ID: "TEST_STU_001"
# 2. Historical chat messages in COLLECTION_CHAT_MEMORY
# 3. PHQ-9 assessments in COLLECTION_PHQ9_VECTORS
# 4. Wellness content in COLLECTION_WELLNESS_CONTENT
```

---

## Unit Tests

### Test 1: Basic Request Processing

**Test:** Verify MAS processes basic request correctly

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "How am I doing today?"
}
```

**Expected Response:**
- Status: 200
- `status`: "success"
- `agent_results`: Array with 5 agents (or fewer if disabled)
- `aggregated_insights`: Complete object with findings
- `drift_state`: "stable", "drifting", or "critical"
- `total_execution_time_ms`: > 0

**Validation:**
```python
def test_basic_mas_request():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'How am I doing today?'
    })
    assert response.status_code == 200
    assert response['status'] == 'success'
    assert len(response['data']['agent_results']) > 0
    assert 'aggregated_insights' in response['data']
    assert response['data']['drift_state'] in ['stable', 'drifting', 'critical']
```

---

### Test 2: Chat Agent Functionality

**Test:** Verify Chat Agent correctly analyzes sentiment

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "I am feeling absolutely wonderful today!",
  "include_chat": true,
  "include_assessment": false,
  "include_drift": false,
  "include_wellness": false,
  "include_memory": false
}
```

**Expected Response:**
- `agent_results[0].agent_type`: "chat"
- `agent_results[0].status`: "success"
- `data.sentiment`: > 0.5 (positive)
- `data.sentiment_label`: "positive"
- `data.emotional_tone`: "calm"

**Validation:**
```python
def test_chat_agent_positive_sentiment():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'I am feeling absolutely wonderful today!',
        'include_chat': True,
        'include_assessment': False,
        'include_drift': False,
        'include_wellness': False,
        'include_memory': False
    })
    assert response.status_code == 200
    chat_result = next(r for r in response['data']['agent_results'] 
                       if r['agent_type'] == 'chat')
    assert chat_result['status'] == 'success'
    assert chat_result['data']['sentiment'] > 0.5
    assert chat_result['data']['sentiment_label'] == 'positive'
```

---

### Test 3: Negative Sentiment Detection

**Test:** Verify Chat Agent detects negative sentiment

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "I am completely hopeless and want to die",
  "include_chat": true,
  "include_assessment": false,
  "include_drift": false,
  "include_wellness": false,
  "include_memory": false
}
```

**Expected Response:**
- `data.sentiment`: < -0.7
- `data.sentiment_label`: "negative"
- `data.emotional_tone`: "distressed"
- Should trigger concern_level update

**Validation:**
```python
def test_chat_agent_severe_negative_sentiment():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'I am completely hopeless and want to die',
        'include_chat': True,
        'include_assessment': False,
        'include_drift': False,
        'include_wellness': False,
        'include_memory': False
    })
    assert response.status_code == 200
    chat_result = next(r for r in response['data']['agent_results'] 
                       if r['agent_type'] == 'chat')
    assert chat_result['data']['sentiment'] < -0.7
    assert chat_result['data']['sentiment_label'] == 'negative'
```

---

### Test 4: Assessment Agent

**Test:** Verify Assessment Agent finds PHQ-9 records

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "What are my PHQ-9 scores?",
  "include_chat": false,
  "include_assessment": true,
  "include_drift": false,
  "include_wellness": false,
  "include_memory": false
}
```

**Expected Response (if data exists):**
- `agent_type`: "assessment"
- `status`: "success"
- `data.recent_assessments`: >= 0
- `data.current_severity`: One of severity levels
- `confidence`: > 0.5

**Validation:**
```python
def test_assessment_agent():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'What are my PHQ-9 scores?',
        'include_assessment': True,
        'include_chat': False,
        'include_drift': False,
        'include_wellness': False,
        'include_memory': False
    })
    assert response.status_code == 200
    assessment_result = next(r for r in response['data']['agent_results'] 
                             if r['agent_type'] == 'assessment')
    assert assessment_result['status'] == 'success'
    assert assessment_result['data']['recent_assessments'] >= 0
```

---

### Test 5: Drift Agent

**Test:** Verify Drift Agent analyzes behavioral patterns

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "Analyze my behavior",
  "include_chat": false,
  "include_assessment": false,
  "include_drift": true,
  "include_wellness": false,
  "include_memory": false
}
```

**Expected Response:**
- `agent_type`: "drift"
- `status`: "success"
- `data.drift_score`: 0-1
- `data.alert_level`: "green", "yellow", or "red"
- `data.drift_status`: "stable", "drifting", or "critical_drift"

**Validation:**
```python
def test_drift_agent():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Analyze my behavior',
        'include_drift': True,
        'include_chat': False,
        'include_assessment': False,
        'include_wellness': False,
        'include_memory': False
    })
    assert response.status_code == 200
    drift_result = next(r for r in response['data']['agent_results'] 
                        if r['agent_type'] == 'drift')
    assert drift_result['status'] == 'success'
    assert 0 <= drift_result['data']['drift_score'] <= 1
    assert drift_result['data']['alert_level'] in ['green', 'yellow', 'red']
```

---

### Test 6: Wellness Agent

**Test:** Verify Wellness Agent generates recommendations

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "What wellness activities should I try?",
  "include_chat": false,
  "include_assessment": false,
  "include_drift": false,
  "include_wellness": true,
  "include_memory": false
}
```

**Expected Response:**
- `agent_type`: "wellness"
- `status`: "success"
- `data.recommendations_found`: >= 0
- `data.categories`: Array of categories
- `data.content_count`: >= 0

**Validation:**
```python
def test_wellness_agent():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'What wellness activities should I try?',
        'include_wellness': True,
        'include_chat': False,
        'include_assessment': False,
        'include_drift': False,
        'include_memory': False
    })
    assert response.status_code == 200
    wellness_result = next(r for r in response['data']['agent_results'] 
                           if r['agent_type'] == 'wellness')
    assert wellness_result['status'] == 'success'
    assert wellness_result['data']['recommendations_found'] >= 0
```

---

### Test 7: Memory Agent

**Test:** Verify Memory Agent finds historical context

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "What have I talked about before?",
  "include_chat": false,
  "include_assessment": false,
  "include_drift": false,
  "include_wellness": false,
  "include_memory": true
}
```

**Expected Response:**
- `agent_type`: "memory"
- `status`: "success"
- `data.total_similar_records`: >= 0
- `data.similar_chat_sessions`: >= 0
- `data.similar_assessments`: >= 0

**Validation:**
```python
def test_memory_agent():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'What have I talked about before?',
        'include_memory': True,
        'include_chat': False,
        'include_assessment': False,
        'include_drift': False,
        'include_wellness': False
    })
    assert response.status_code == 200
    memory_result = next(r for r in response['data']['agent_results'] 
                         if r['agent_type'] == 'memory')
    assert memory_result['status'] == 'success'
    assert memory_result['data']['total_similar_records'] >= 0
```

---

### Test 8: All Agents Enabled

**Test:** Verify all agents execute together

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "Complete mental health evaluation",
  "include_chat": true,
  "include_assessment": true,
  "include_drift": true,
  "include_wellness": true,
  "include_memory": true
}
```

**Expected Response:**
- `agents_executed`: 5
- All 5 agent types in results
- Aggregated insights complete
- `total_execution_time_ms`: 400-800ms

**Validation:**
```python
def test_all_agents_enabled():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Complete mental health evaluation'
    })
    assert response.status_code == 200
    assert response['data']['agents_executed'] == 5
    agent_types = {r['agent_type'] for r in response['data']['agent_results']}
    assert agent_types == {'chat', 'assessment', 'drift', 'wellness', 'memory'}
    assert 0 < response['data']['total_execution_time_ms'] < 2000
```

---

### Test 9: Concern Level - Normal

**Test:** Verify "normal" concern level classification

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "Everything is going well"
}
```

**Expected Response:**
- `aggregated_insights.concern_level`: "normal"
- `primary_concern`: Mentions stable/positive state
- `drift_state`: "stable"
- `actions[0].action_type`: "monitor"

**Validation:**
```python
def test_concern_level_normal():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Everything is going well'
    })
    assert response.status_code == 200
    insights = response['data']['aggregated_insights']
    assert insights['concern_level'] == 'normal'
    assert response['data']['drift_state'] == 'stable'
    assert response['data']['actions'][0]['action_type'] == 'monitor'
```

---

### Test 10: Concern Level - Elevated

**Test:** Verify "elevated" concern level classification

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "I've been feeling sad and struggling with motivation"
}
```

**Expected Response:**
- `aggregated_insights.concern_level`: "elevated"
- `drift_state`: "drifting"
- `actions[0].action_type`: "intervene"

**Validation:**
```python
def test_concern_level_elevated():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'I\'ve been feeling sad and struggling'
    })
    assert response.status_code == 200
    insights = response['data']['aggregated_insights']
    assert insights['concern_level'] == 'elevated'
    assert response['data']['drift_state'] == 'drifting'
```

---

### Test 11: Concern Level - Critical

**Test:** Verify "critical" concern level classification

**Request:**
```json
{
  "student_id": "TEST_STU_001",
  "query": "I want to harm myself"
}
```

**Expected Response:**
- `aggregated_insights.concern_level`: "critical"
- `drift_state`: "critical"
- `actions[0].action_type`: "emergency"
- `actions[0].priority`: "critical" or "high"

**Validation:**
```python
def test_concern_level_critical():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'I want to harm myself'
    })
    assert response.status_code == 200
    insights = response['data']['aggregated_insights']
    assert insights['concern_level'] == 'critical'
    assert response['data']['drift_state'] == 'critical'
    assert response['data']['actions'][0]['action_type'] == 'emergency'
```

---

## Integration Tests

### Test 12: Full Workflow - Initial Check
```python
def test_full_workflow_initial_check():
    # Step 1: Initial quick assessment
    response1 = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Quick check on my mental health',
        'analysis_depth': 'quick'
    })
    assert response1.status_code == 200
    
    # Verify response structure
    assert 'mas_id' in response1['data']
    assert 'aggregated_insights' in response1['data']
    assert 'agent_results' in response1['data']
    
    # Store MAS ID for tracking
    mas_id = response1['data']['mas_id']
    assert mas_id is not None
```

### Test 13: Full Workflow - Follow-Up Analysis
```python
def test_full_workflow_followup_analysis():
    # Initial assessment
    response1 = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Initial check'
    })
    
    initial_concern = response1['data']['aggregated_insights']['concern_level']
    
    # If elevated or critical, do deep analysis
    if initial_concern in ['elevated', 'critical']:
        response2 = post('/mas/execute', {
            'student_id': 'TEST_STU_001',
            'query': 'Detailed evaluation needed',
            'analysis_depth': 'deep',
            'return_reasoning': True
        })
        assert response2.status_code == 200
        assert response2['data']['analysis_timestamp'] is not None
```

---

## Performance Tests

### Test 14: Quick Analysis Performance
```python
def test_quick_analysis_performance():
    import time
    
    start_time = time.time()
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Quick check',
        'analysis_depth': 'quick'
    })
    duration = time.time() - start_time
    
    assert response.status_code == 200
    assert duration < 0.5  # Should complete in < 500ms
    assert response['data']['total_execution_time_ms'] < 500
```

### Test 15: All Agents Performance
```python
def test_all_agents_performance():
    import time
    
    start_time = time.time()
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Complete evaluation'
    })
    duration = time.time() - start_time
    
    assert response.status_code == 200
    assert duration < 2.0  # Should complete in < 2 seconds
    assert response['data']['total_execution_time_ms'] < 2000
    assert response['data']['agents_executed'] == 5
```

---

## Error Handling Tests

### Test 16: Missing Required Field - Student ID
```python
def test_error_missing_student_id():
    response = post('/mas/execute', {
        'query': 'How am I?'
    })
    assert response.status_code == 422
    assert 'student_id' in response.get('detail', '')
```

### Test 17: Missing Required Field - Query
```python
def test_error_missing_query():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001'
    })
    assert response.status_code == 422
    assert 'query' in response.get('detail', '')
```

### Test 18: Query Too Short
```python
def test_error_query_too_short():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Hi'  # Less than 5 characters
    })
    assert response.status_code == 422
```

### Test 19: Invalid Analysis Depth
```python
def test_error_invalid_analysis_depth():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'How am I?',
        'analysis_depth': 'invalid_depth'
    })
    assert response.status_code == 422
```

### Test 20: Invalid Context Window
```python
def test_error_invalid_context_window():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'How am I?',
        'context_window': 200  # > 100
    })
    assert response.status_code == 422
```

---

## Data Consistency Tests

### Test 21: Qdrant Storage Verification
```python
def test_qdrant_storage_verification():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Test query for storage verification'
    })
    assert response.status_code == 200
    
    # Verify data was stored
    for agent_result in response['data']['agent_results']:
        if 'vector_id' in agent_result['data']:
            # Verify vector exists in Qdrant
            # (would need to query Qdrant directly)
            assert agent_result['data']['vector_id'] is not None
```

### Test 22: Response Schema Validation
```python
def test_response_schema_validation():
    response = post('/mas/execute', {
        'student_id': 'TEST_STU_001',
        'query': 'Schema validation test'
    })
    assert response.status_code == 200
    
    # Verify all required fields present
    required_fields = [
        'mas_id', 'student_id', 'query', 'agent_results',
        'aggregated_insights', 'total_execution_time_ms',
        'agents_executed', 'analysis_timestamp', 'drift_state'
    ]
    
    for field in required_fields:
        assert field in response['data'], f"Missing field: {field}"
```

---

## Testing Script (Python)

```python
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def post(endpoint, data):
    """Helper to make POST request"""
    response = requests.post(f"{BASE_URL}{endpoint}", json=data)
    return response.json()

def run_all_tests():
    """Run complete test suite"""
    test_results = {}
    
    tests = [
        ("Basic Request", test_basic_mas_request),
        ("Chat Agent", test_chat_agent_positive_sentiment),
        ("Negative Sentiment", test_chat_agent_severe_negative_sentiment),
        ("Assessment Agent", test_assessment_agent),
        ("Drift Agent", test_drift_agent),
        ("Wellness Agent", test_wellness_agent),
        ("Memory Agent", test_memory_agent),
        ("All Agents", test_all_agents_enabled),
        ("Normal Concern", test_concern_level_normal),
        ("Elevated Concern", test_concern_level_elevated),
        ("Critical Concern", test_concern_level_critical),
        ("Performance", test_all_agents_performance),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
            test_results[test_name] = "✓ PASS"
        except AssertionError as e:
            test_results[test_name] = f"✗ FAIL: {str(e)}"
        except Exception as e:
            test_results[test_name] = f"✗ ERROR: {str(e)}"
    
    # Print results
    print("\n" + "="*50)
    print("MAS ORCHESTRATOR TEST RESULTS")
    print("="*50)
    for test_name, result in test_results.items():
        print(f"{test_name:30} {result}")
    print("="*50)
    
    # Summary
    passed = sum(1 for r in test_results.values() if "PASS" in r)
    total = len(test_results)
    print(f"\nSummary: {passed}/{total} tests passed")

if __name__ == "__main__":
    run_all_tests()
```

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: MAS Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: pip install requests pytest
      - name: Run MAS tests
        run: python test_mas.py
```

---

## Monitoring & Debugging

### Enable Verbose Logging
```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Now all requests will be logged with full details
```

### Check Server Logs
```bash
# Monitor backend logs in real-time
tail -f /path/to/backend.log | grep "MAS"
```

### Test Data Inspection
```python
# Query Qdrant directly to verify test data
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)
results = client.scroll(
    collection_name="chat_memory",
    limit=10
)
print(json.dumps(results, indent=2))
```

---

## Troubleshooting

### Test Failures

| Symptom | Cause | Solution |
|---------|-------|----------|
| All tests fail | Server not running | Start backend: `python main.py` |
| Agent not found | Qdrant empty | Seed test data |
| Slow responses | High load | Reduce context_window |
| Connection error | Wrong URL | Verify BASE_URL |
| Validation errors | Old schema | Update schema definitions |

### Performance Issues

- Reduce `context_window` parameter
- Use `analysis_depth: "quick"`
- Disable unused agents
- Check Qdrant performance

---

## References

- [MAS Orchestrator Guide](./MAS_ORCHESTRATOR_GUIDE.md)
- [API Reference](./MAS_API_REFERENCE.md)
- [Backend Main](./main.py)

