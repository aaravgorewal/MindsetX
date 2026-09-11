# MAS Orchestrator API Reference

## Quick Reference

**Endpoint:** `POST /mas/execute`

**Base URL:** `http://localhost:8000`

**Authentication:** Standard API authentication

**Tags:** Intelligence

---

## Endpoint Details

### URL
```
POST /mas/execute
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <token> (if required)
```

### Request Body

```json
{
  "student_id": "string (required)",
  "query": "string (required, min 5 chars)",
  "agents": [
    {
      "agent_type": "string",
      "enabled": boolean,
      "priority": integer (1-5),
      "config": {}
    }
  ],
  "include_chat": boolean,
  "include_assessment": boolean,
  "include_drift": boolean,
  "include_wellness": boolean,
  "include_memory": boolean,
  "analysis_depth": "string (quick|standard|deep)",
  "return_reasoning": boolean,
  "context_window": integer (1-100)
}
```

### Response Body

```json
{
  "status": "success|error",
  "data": {
    "mas_id": "string",
    "student_id": "string",
    "query": "string",
    "agent_results": [
      {
        "agent_type": "string",
        "status": "success|error|partial",
        "data": {},
        "confidence": number,
        "execution_time_ms": number,
        "reasoning": "string|null",
        "error": "string|null"
      }
    ],
    "aggregated_insights": {
      "primary_concern": "string|null",
      "concern_level": "critical|elevated|normal",
      "key_findings": ["string"],
      "recommended_actions": ["string"],
      "follow_up_agents": ["string"],
      "confidence_score": number
    },
    "total_execution_time_ms": number,
    "agents_executed": integer,
    "analysis_timestamp": "string (ISO 8601)",
    "drift_state": "stable|drifting|critical"
  },
  "drift_state": "stable|drifting|critical",
  "actions": [
    {
      "action_type": "monitor|intervene|emergency",
      "priority": "low|medium|high",
      "description": "string"
    }
  ],
  "message": "string"
}
```

---

## Parameters

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `student_id` | string | Unique student identifier (e.g., "STU12345") |
| `query` | string | Analysis query or user input (minimum 5 characters) |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agents` | array | null | Custom agent configuration list |
| `include_chat` | boolean | true | Enable Chat Agent (sentiment analysis) |
| `include_assessment` | boolean | true | Enable Assessment Agent (PHQ-9 analysis) |
| `include_drift` | boolean | true | Enable Drift Agent (behavioral patterns) |
| `include_wellness` | boolean | true | Enable Wellness Agent (recommendations) |
| `include_memory` | boolean | true | Enable Memory Agent (historical context) |
| `analysis_depth` | string | "standard" | Analysis depth: "quick", "standard", or "deep" |
| `return_reasoning` | boolean | false | Include agent reasoning in response |
| `context_window` | integer | 10 | Number of past records to analyze (1-100) |

---

## Agent Types

### Agent Configuration

```python
class MASAgentConfig(BaseModel):
    agent_type: str         # "chat" | "assessment" | "drift" | "wellness" | "memory"
    enabled: bool           # Whether to execute this agent
    priority: int           # Execution priority (1-5, 1=highest)
    config: Dict            # Agent-specific configuration options
```

### Available Agents

1. **chat** - Sentiment analysis and emotional tone detection
2. **assessment** - PHQ-9 score analysis and severity trends
3. **drift** - Behavioral change detection
4. **wellness** - Personalized resource recommendations
5. **memory** - Historical pattern and context analysis

---

## Response Fields

### Root Response

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | "success" or "error" |
| `data` | object | MAS execution results |
| `drift_state` | string | Overall drift state |
| `actions` | array | Recommended actions |
| `message` | string | Status message |

### MAS Data Object

| Field | Type | Description |
|-------|------|-------------|
| `mas_id` | string | Unique execution identifier |
| `student_id` | string | Student identifier |
| `query` | string | Original query text |
| `agent_results` | array | Results from each agent |
| `aggregated_insights` | object | Combined analysis |
| `total_execution_time_ms` | number | Total processing time |
| `agents_executed` | integer | Number of agents executed |
| `analysis_timestamp` | string | ISO 8601 timestamp |
| `drift_state` | string | "stable", "drifting", or "critical" |

### Agent Result Object

| Field | Type | Description |
|-------|------|-------------|
| `agent_type` | string | Type of agent |
| `status` | string | "success", "error", or "partial" |
| `data` | object | Agent-specific results |
| `confidence` | number | Confidence score (0-1) |
| `execution_time_ms` | number | Processing time in milliseconds |
| `reasoning` | string | Agent reasoning (if requested) |
| `error` | string | Error message (if failed) |

### Aggregated Insights Object

| Field | Type | Description |
|-------|------|-------------|
| `primary_concern` | string | Most critical finding |
| `concern_level` | string | "critical", "elevated", or "normal" |
| `key_findings` | array | Summary of key findings |
| `recommended_actions` | array | Up to 5 recommended actions |
| `follow_up_agents` | array | Suggested agents for follow-up |
| `confidence_score` | number | Overall confidence (0-1) |

---

## Status Codes

| Code | Description | Condition |
|------|-------------|-----------|
| 200 | OK | Successful analysis |
| 400 | Bad Request | Missing required fields |
| 422 | Unprocessable Entity | Validation error (query < 5 chars) |
| 500 | Internal Server Error | Unexpected server error |

---

## Common Requests

### Minimal Request
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "I am not feeling well"
  }'
```

### Full Request with All Parameters
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "I have been stressed about exams",
    "agents": [
      {
        "agent_type": "chat",
        "enabled": true,
        "priority": 1,
        "config": {}
      }
    ],
    "include_chat": true,
    "include_assessment": true,
    "include_drift": true,
    "include_wellness": true,
    "include_memory": true,
    "analysis_depth": "standard",
    "return_reasoning": true,
    "context_window": 10
  }'
```

### Quick Analysis (Fastest)
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "Quick check",
    "analysis_depth": "quick",
    "include_wellness": false,
    "include_memory": false,
    "context_window": 3
  }'
```

### Deep Analysis (Most Thorough)
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "Comprehensive evaluation needed",
    "analysis_depth": "deep",
    "return_reasoning": true,
    "context_window": 50
  }'
```

---

## Response Examples

### Successful Response - Stable Condition
```json
{
  "status": "success",
  "data": {
    "mas_id": "mas-abc123",
    "student_id": "STU12345",
    "query": "How am I doing?",
    "agent_results": [
      {
        "agent_type": "chat",
        "status": "success",
        "data": {
          "sentiment": 0.25,
          "sentiment_label": "positive",
          "emotional_tone": "calm"
        },
        "confidence": 0.82,
        "execution_time_ms": 42.5
      },
      {
        "agent_type": "assessment",
        "status": "success",
        "data": {
          "recent_assessments": 2,
          "avg_phq9_score": 4.5,
          "current_severity": "Minimal"
        },
        "confidence": 0.75,
        "execution_time_ms": 118.3
      }
    ],
    "aggregated_insights": {
      "primary_concern": "Student appears stable",
      "concern_level": "normal",
      "key_findings": ["Positive sentiment", "Minimal PHQ-9 symptoms"],
      "recommended_actions": ["Continue current wellness routine"],
      "confidence_score": 0.785
    },
    "total_execution_time_ms": 265.8,
    "agents_executed": 5,
    "analysis_timestamp": "2024-01-15T14:30:25Z",
    "drift_state": "stable"
  },
  "drift_state": "stable",
  "actions": [
    {
      "action_type": "monitor",
      "priority": "low",
      "description": "Continue regular monitoring"
    }
  ],
  "message": "Multi-Agent System analysis complete (5 agents, 265ms)"
}
```

### Crisis Detection Response
```json
{
  "status": "success",
  "data": {
    "mas_id": "mas-xyz789",
    "student_id": "STU12345",
    "query": "I don't want to live anymore",
    "agent_results": [
      {
        "agent_type": "chat",
        "status": "success",
        "data": {
          "sentiment": -0.95,
          "sentiment_label": "negative",
          "emotional_tone": "severe_distress"
        },
        "confidence": 0.98,
        "execution_time_ms": 45.2
      }
    ],
    "aggregated_insights": {
      "primary_concern": "Critical mental health concern detected - immediate intervention required",
      "concern_level": "critical",
      "key_findings": [
        "Severe negative sentiment (-0.95)",
        "Self-harm ideation detected",
        "Critical psychological distress"
      ],
      "recommended_actions": [
        "Contact crisis hotline immediately",
        "Notify campus counseling services",
        "Activate emergency intervention protocol"
      ],
      "confidence_score": 0.98
    },
    "total_execution_time_ms": 456.1,
    "agents_executed": 1,
    "analysis_timestamp": "2024-01-15T14:35:42Z",
    "drift_state": "critical"
  },
  "drift_state": "critical",
  "actions": [
    {
      "action_type": "emergency",
      "priority": "critical",
      "description": "Critical MAS analysis. Immediate intervention required."
    }
  ],
  "message": "Multi-Agent System analysis complete (1 agents, 456ms)"
}
```

### Error Response
```json
{
  "status": "error",
  "data": null,
  "message": "MAS execution failed: Student not found",
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "detail": "No records found for student STU99999"
  }
}
```

---

## Error Scenarios

### Validation Error: Query Too Short
```json
{
  "status": "error",
  "message": "Query must be at least 5 characters long",
  "error": "VALIDATION_ERROR"
}
```

### Validation Error: Invalid Student ID
```json
{
  "status": "error",
  "message": "Student ID is required",
  "error": "MISSING_REQUIRED_FIELD"
}
```

### Server Error
```json
{
  "status": "error",
  "message": "Internal server error occurred",
  "error": "Qdrant connection failed"
}
```

---

## Performance Notes

### Typical Execution Times
- **All Agents (Default):** 400-600ms
- **Chat Only:** 40-80ms
- **Assessment Only:** 100-200ms
- **Quick Depth:** 200-300ms
- **Standard Depth:** 400-600ms
- **Deep Depth:** 800-1200ms

### Optimization Tips
1. Disable unused agents to reduce latency
2. Use "quick" depth for fast screening
3. Reduce context_window for faster memory queries
4. Cache results for frequently-asked queries

---

## Example Workflow

### 1. Initial Assessment
```javascript
// Step 1: Quick initial assessment
const initial = await fetch('/mas/execute', {
  method: 'POST',
  body: JSON.stringify({
    student_id: "STU12345",
    query: "Hi, can you check on me?",
    analysis_depth: "quick"
  })
});
```

### 2. Detailed Follow-Up (if needed)
```javascript
// Step 2: If concern_level != "normal", do deep analysis
if (initial.concern_level === 'elevated' || initial.concern_level === 'critical') {
  const detailed = await fetch('/mas/execute', {
    method: 'POST',
    body: JSON.stringify({
      student_id: "STU12345",
      query: "Detailed evaluation needed",
      analysis_depth: "deep",
      return_reasoning: true
    })
  });
}
```

### 3. Intervention
```javascript
// Step 3: Route to appropriate intervention
if (detailed.concern_level === 'critical') {
  // Activate emergency protocol
  await activateEmergencyResponse(detailed);
} else if (detailed.concern_level === 'elevated') {
  // Schedule counseling session
  await scheduleCounseling(detailed.student_id);
}
```

---

## Integration Examples

### JavaScript/Fetch
```javascript
async function analyzeMentalHealth(studentId, query) {
  const response = await fetch('/mas/execute', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      student_id: studentId,
      query: query
    })
  });
  return await response.json();
}
```

### Python/Requests
```python
import requests

def analyze_mental_health(student_id, query):
    response = requests.post('/mas/execute', json={
        'student_id': student_id,
        'query': query
    })
    return response.json()
```

### cURL
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "Check my mental health status"
  }'
```

---

## Related Documentation

- [MAS Orchestrator Guide](./MAS_ORCHESTRATOR_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Integration Guide](./SAFEBIO_FRONTEND_INTEGRATION.md)
- [Testing Guide](./SAFEBIO_TESTING_GUIDE.md)

---

## Support

For issues or questions:
1. Check the [MAS Orchestrator Guide](./MAS_ORCHESTRATOR_GUIDE.md)
2. Review [error scenarios](#error-scenarios) above
3. Check server logs for detailed error messages
4. Contact support team with MAS ID for investigation

