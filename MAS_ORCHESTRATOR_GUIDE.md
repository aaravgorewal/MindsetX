# Multi-Agent System (MAS) Orchestrator Guide

## Overview

The Multi-Agent System (MAS) Orchestrator endpoint (`/mas/execute`) is a comprehensive intelligence routing system that coordinates five specialized agents to provide holistic analysis of student mental health and wellness.

**Endpoint:** `POST /mas/execute`

**Tags:** Intelligence

**Response Model:** UnifiedResponse

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAS Orchestrator                             │
│              (/mas/execute)                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │  Chat   │        │Assessm- │        │ Drift   │
    │ Agent   │        │  ent    │        │ Agent   │
    │         │        │ Agent   │        │         │
    └─────────┘        └─────────┘        └─────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌─────────┐        ┌─────────┐
    │Wellness │        │ Memory  │
    │ Agent   │        │ Agent   │
    │         │        │         │
    └─────────┘        └─────────┘
        │                   │
        └───────────────────┼───────────────────┐
                            │                   │
                            ▼                   ▼
                    ┌──────────────────────────────────┐
                    │  Aggregation Engine              │
                    │  • Conflict Resolution           │
                    │  • Confidence Scoring            │
                    │  • Action Generation             │
                    └──────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────────────────────────┐
                    │  Unified Response                │
                    │  • Agent Results                 │
                    │  • Aggregated Insights           │
                    │  • Recommended Actions           │
                    │  • Drift State                   │
                    └──────────────────────────────────┘
```

## Agents

### 1. Chat Agent (Sentiment Analysis)
**Purpose:** Analyze emotional tone and sentiment of user input

**Functionality:**
- Extracts sentiment polarity from query text
- Generates sentiment embedding
- Stores analysis in Qdrant COLLECTION_CHAT_MEMORY
- Determines emotional tone (calm/neutral/distressed)

**Output:**
- `sentiment`: Polarity score (-1 to 1)
- `sentiment_label`: "positive" | "neutral" | "negative"
- `emotional_tone`: Categorized tone
- `conversation_potential`: Assessment of engagement readiness
- `vector_id`: Qdrant storage reference

**Confidence Factors:**
- Strength of sentiment signal
- Text length and clarity

---

### 2. Assessment Agent (PHQ-9 Analysis)
**Purpose:** Analyze mental health scores and severity trends

**Functionality:**
- Queries historical PHQ-9 assessments via semantic search
- Analyzes severity trends over time
- Calculates average PHQ-9 scores
- Maps severity to concern levels

**Output:**
- `recent_assessments`: Number of assessments found
- `severity_trend`: Array of severity levels (newest to oldest)
- `avg_phq9_score`: Average score across assessments
- `current_severity`: Latest severity classification
- `assessments_found`: Boolean indicating data availability

**Severity Levels:**
- Minimal/None (0-4) → STABLE
- Mild (5-9) → STABLE
- Moderate (10-14) → DRIFTING
- Moderately Severe (15-19) → DRIFTING
- Severe (20+) → CRITICAL

**Confidence Factors:**
- Number of assessments available
- Severity trend consistency
- Recency of data

---

### 3. Drift Agent (Behavioral Pattern Detection)
**Purpose:** Detect behavioral changes and patterns over time

**Functionality:**
- Performs comprehensive drift analysis
- Analyzes both chat and PHQ-9 drift scores
- Generates alert levels (green/yellow/red)
- Compares recent vs. historical patterns

**Output:**
- `drift_score`: Overall drift magnitude (0-1)
- `drift_status`: "stable" | "drifting" | "critical_drift"
- `alert_level`: "green" | "yellow" | "red"
- `chat_drift`: Chat message drift score
- `phq9_drift`: Assessment drift score
- `records_analyzed`: Number of historical records used

**Alert Mapping:**
- Green (< 0.3): STABLE
- Yellow (0.3-0.6): DRIFTING
- Red (> 0.6): CRITICAL

**Confidence Factors:**
- Historical data availability
- Pattern consistency
- Statistical significance

---

### 4. Wellness Agent (Resource Recommendation)
**Purpose:** Generate personalized wellness recommendations

**Functionality:**
- Queries wellness content repository
- Performs semantic matching against user query
- Filters by student profile and mood
- Ranks recommendations by relevance

**Output:**
- `recommendations_found`: Total matching resources
- `categories`: List of relevant wellness categories
- `content_count`: Number of recommended items
- Resource titles and descriptions

**Recommendation Sources:**
- Mindfulness & meditation content
- Stress management techniques
- Physical wellness resources
- Social connection opportunities
- Sleep optimization guides

**Confidence Factors:**
- Number of matching resources
- Semantic similarity scores
- Category diversity

---

### 5. Memory Agent (Historical Context)
**Purpose:** Provide historical context and pattern recognition

**Functionality:**
- Searches Qdrant for semantically similar past sessions
- Analyzes conversation patterns
- Identifies recurring themes
- Compares with historical assessments

**Output:**
- `similar_chat_sessions`: Number of matching chat records
- `similar_assessments`: Number of matching assessments
- `total_similar_records`: Combined count
- `chat_session_topics`: Extracted topics from history
- `assessment_count`: Historical assessment data

**Search Scope:**
- Configurable context window (1-100 records)
- Default: 10 past records
- Time-aware filtering

**Confidence Factors:**
- Number of similar records found
- Semantic similarity scores
- Pattern consistency

---

## Request Model

```python
class MASExecuteRequest(BaseModel):
    student_id: str                    # Required: Student identifier
    query: str                         # Required: Analysis query (min 5 chars)
    
    # Agent Configuration
    agents: Optional[List[MASAgentConfig]]  # Optional: Custom agent config
    include_chat: bool = True          # Enable Chat Agent
    include_assessment: bool = True    # Enable Assessment Agent
    include_drift: bool = True         # Enable Drift Agent
    include_wellness: bool = True      # Enable Wellness Agent
    include_memory: bool = True        # Enable Memory Agent
    
    # Analysis Parameters
    analysis_depth: str = "standard"   # "quick" | "standard" | "deep"
    return_reasoning: bool = False     # Include agent reasoning
    context_window: int = 10           # Past records to analyze (1-100)
```

### Request Examples

**Basic Request:**
```json
{
  "student_id": "STU12345",
  "query": "I've been feeling really overwhelmed with coursework lately"
}
```

**Advanced Request with Custom Configuration:**
```json
{
  "student_id": "STU12345",
  "query": "I've been feeling really overwhelmed with coursework lately",
  "analysis_depth": "deep",
  "return_reasoning": true,
  "context_window": 20,
  "include_chat": true,
  "include_assessment": true,
  "include_drift": true,
  "include_wellness": true,
  "include_memory": true
}
```

**Focused Analysis (Only Specific Agents):**
```json
{
  "student_id": "STU12345",
  "query": "How am I doing overall?",
  "include_chat": false,
  "include_assessment": true,
  "include_drift": true,
  "include_wellness": true,
  "include_memory": false
}
```

---

## Response Model

```python
class MASExecuteResponse(BaseModel):
    mas_id: str                        # Unique execution ID
    student_id: str                    # Student identifier
    query: str                         # Original query
    agent_results: List[MASAgentResult]    # Individual agent outputs
    aggregated_insights: MASAggregatedInsights  # Combined analysis
    total_execution_time_ms: float     # Total processing time
    agents_executed: int               # Number of agents that ran
    analysis_timestamp: str            # ISO timestamp of analysis
    drift_state: str                   # "stable" | "drifting" | "critical"
```

### Agent Result Structure

```python
class MASAgentResult(BaseModel):
    agent_type: str                    # Agent identifier
    status: str                        # "success" | "error" | "partial"
    data: Dict[str, Any]               # Agent-specific results
    confidence: float                  # Confidence score (0-1)
    execution_time_ms: float           # Agent processing time
    reasoning: Optional[str]           # Agent reasoning explanation
    error: Optional[str]               # Error message if failed
```

### Aggregated Insights

```python
class MASAggregatedInsights(BaseModel):
    primary_concern: Optional[str]     # Most critical finding
    concern_level: str                 # "critical" | "elevated" | "normal"
    key_findings: List[str]            # Summary of findings
    recommended_actions: List[str]     # 1-5 prioritized actions
    follow_up_agents: List[str]        # Suggested agents for follow-up
    confidence_score: float            # Overall confidence (0-1)
```

### Response Example

```json
{
  "status": "success",
  "data": {
    "mas_id": "mas-uuid-1234",
    "student_id": "STU12345",
    "query": "I've been feeling really overwhelmed",
    "agent_results": [
      {
        "agent_type": "chat",
        "status": "success",
        "data": {
          "sentiment": -0.65,
          "sentiment_label": "negative",
          "emotional_tone": "distressed",
          "conversation_potential": "moderate"
        },
        "confidence": 0.85,
        "execution_time_ms": 45.2,
        "reasoning": "Chat agent detected negative sentiment (-0.65) in query..."
      },
      {
        "agent_type": "assessment",
        "status": "success",
        "data": {
          "recent_assessments": 3,
          "severity_trend": ["Moderate", "Mild", "Mild"],
          "avg_phq9_score": 11.3,
          "current_severity": "Moderate"
        },
        "confidence": 0.78,
        "execution_time_ms": 120.5
      },
      {
        "agent_type": "drift",
        "status": "success",
        "data": {
          "drift_score": 0.55,
          "drift_status": "drifting",
          "alert_level": "yellow",
          "chat_drift": 0.48,
          "phq9_drift": 0.62
        },
        "confidence": 0.82,
        "execution_time_ms": 85.3
      },
      {
        "agent_type": "wellness",
        "status": "success",
        "data": {
          "recommendations_found": 7,
          "categories": ["stress_management", "mindfulness", "time_management"],
          "content_count": 7
        },
        "confidence": 0.71,
        "execution_time_ms": 95.1
      },
      {
        "agent_type": "memory",
        "status": "success",
        "data": {
          "similar_chat_sessions": 5,
          "similar_assessments": 2,
          "total_similar_records": 7
        },
        "confidence": 0.68,
        "execution_time_ms": 110.2
      }
    ],
    "aggregated_insights": {
      "primary_concern": "Elevated concern level - professional follow-up suggested",
      "concern_level": "elevated",
      "key_findings": [
        "High negative sentiment detected (-0.65)",
        "Latest PHQ-9 severity: Moderate",
        "Behavioral drift detected: drifting (score: 0.55)",
        "Historical context: 7 similar past records found"
      ],
      "recommended_actions": [
        "Try 'Stress Management Techniques' from wellness content",
        "Monitor behavioral changes closely - Alert: yellow",
        "Try 'Mindfulness for Stress Relief' from wellness content",
        "Consider scheduling counseling appointment"
      ],
      "follow_up_agents": ["drift", "assessment"],
      "confidence_score": 0.768
    },
    "total_execution_time_ms": 456.3,
    "agents_executed": 5,
    "analysis_timestamp": "2024-01-15T14:30:25.123456Z",
    "drift_state": "drifting"
  },
  "drift_state": "drifting",
  "actions": [
    {
      "action_type": "intervene",
      "priority": "high",
      "description": "MAS analysis flagged elevated concern. Professional follow-up recommended."
    }
  ],
  "message": "Multi-Agent System analysis complete (5 agents, 456ms)"
}
```

---

## Concern Levels & Actions

### NORMAL (Green)
- **Condition:** All agents report stable findings
- **Example:** Positive sentiment, minimal symptoms, no drift
- **Actions:** Monitor action - continue regular check-ins
- **Recommendation:** Maintain current wellness routine

### ELEVATED (Yellow)
- **Condition:** One or more agents flag concern
- **Example:** Moderate PHQ-9 scores, moderate drift, negative sentiment
- **Actions:** Intervene action - professional follow-up suggested
- **Recommendation:** Schedule counseling, increase check-ins

### CRITICAL (Red)
- **Condition:** Multiple agents flag serious concern
- **Example:** Severe PHQ-9 scores, high drift, self-harm mention
- **Actions:** Emergency action - immediate intervention required
- **Recommendation:** Crisis intervention, emergency services

---

## Use Cases

### 1. Routine Mental Health Check-In
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "How am I doing overall?"
  }'
```

### 2. Crisis Detection
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "I don'\''t want to live anymore",
    "analysis_depth": "deep"
  }'
```

### 3. Wellness Planning
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "What can I do to improve my mental health?",
    "include_wellness": true,
    "include_memory": true
  }'
```

### 4. Assessment Follow-Up
```bash
curl -X POST http://localhost:8000/mas/execute \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU12345",
    "query": "How have my PHQ-9 scores been trending?",
    "include_assessment": true,
    "include_drift": true,
    "context_window": 20
  }'
```

---

## Integration with Frontend

### React/TypeScript Integration

```typescript
interface MASRequest {
  student_id: string;
  query: string;
  analysis_depth?: "quick" | "standard" | "deep";
  return_reasoning?: boolean;
  context_window?: number;
}

interface AgentResult {
  agent_type: string;
  status: "success" | "error" | "partial";
  data: Record<string, unknown>;
  confidence: number;
  execution_time_ms: number;
  reasoning?: string;
}

interface MASResponse {
  mas_id: string;
  student_id: string;
  query: string;
  agent_results: AgentResult[];
  aggregated_insights: {
    primary_concern: string;
    concern_level: "critical" | "elevated" | "normal";
    key_findings: string[];
    recommended_actions: string[];
    follow_up_agents: string[];
    confidence_score: number;
  };
  total_execution_time_ms: number;
  agents_executed: number;
  analysis_timestamp: string;
  drift_state: "stable" | "drifting" | "critical";
}

async function executeMASAnalysis(request: MASRequest): Promise<MASResponse> {
  const response = await fetch('/mas/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  const result = await response.json();
  
  if (result.status === 'error') {
    throw new Error(result.message);
  }
  
  return result.data;
}

// Usage
const analysis = await executeMASAnalysis({
  student_id: "STU12345",
  query: "I've been feeling overwhelmed",
  analysis_depth: "standard"
});

console.log(`Concern Level: ${analysis.aggregated_insights.concern_level}`);
console.log(`Primary Concern: ${analysis.aggregated_insights.primary_concern}`);
console.log(`Confidence: ${(analysis.aggregated_insights.confidence_score * 100).toFixed(1)}%`);
console.log(`Recommended Actions:`);
analysis.aggregated_insights.recommended_actions.forEach(action => {
  console.log(`  - ${action}`);
});
```

---

## Performance & Optimization

### Execution Time Breakdown
- **Chat Agent:** 40-60ms
- **Assessment Agent:** 100-150ms (depends on historical data)
- **Drift Agent:** 80-120ms
- **Wellness Agent:** 80-120ms
- **Memory Agent:** 100-150ms
- **Total Typical:** 400-600ms (all agents)

### Optimization Strategies

1. **Selective Agent Execution:** Disable unnecessary agents to reduce latency
   ```json
   {
     "include_chat": true,
     "include_assessment": true,
     "include_drift": false,
     "include_wellness": false,
     "include_memory": false
   }
   ```

2. **Reduced Context Window:** Use smaller `context_window` for faster memory queries
   ```json
   {
     "context_window": 5
   }
   ```

3. **Quick Analysis Mode:** Use `quick` depth for faster processing
   ```json
   {
     "analysis_depth": "quick"
   }
   ```

---

## Error Handling

### Partial Failures
MAS handles individual agent failures gracefully:

```json
{
  "agent_type": "assessment",
  "status": "error",
  "data": {},
  "confidence": 0.0,
  "error": "No historical assessments found for student"
}
```

- Other agents continue executing
- Aggregation uses available data
- Response still includes successful agent results

### Retry Logic
```typescript
async function executeMASWithRetry(
  request: MASRequest,
  maxRetries: number = 3
): Promise<MASResponse> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await executeMASAnalysis(request);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Monitoring & Logging

All MAS executions are logged with:
- MAS ID (unique execution identifier)
- Student ID
- Query text (truncated to 60 chars)
- Analysis depth
- Agent enablement status
- Per-agent execution times
- Overall confidence score
- Concern level

Example Log Output:
```
🤖 MAS Execution Started: mas-uuid-1234
   Student: STU12345
   Query: I've been feeling really overwhelmed...
   Depth: standard
   Agents: Chat=true, Assessment=true, Drift=true, Wellness=true, Memory=true
   ✓ Chat Agent: Sentiment=-0.65, Confidence=0.85
   ✓ Assessment Agent: Found=3, Confidence=0.78
   ✓ Drift Agent: Score=0.55, Alert=yellow, Confidence=0.82
   ✓ Wellness Agent: Found=7, Confidence=0.71
   ✓ Memory Agent: Total=7, Confidence=0.68
🎯 MAS Execution Complete: mas-uuid-1234
   Agents: 5 executed
   Confidence: 0.768
   Concern Level: elevated
   Time: 456.3ms
   Primary Concern: Elevated concern level - professional follow-up suggested
```

---

## Security & Privacy

- **Student ID Filtering:** All queries filtered by student_id
- **Qdrant Storage:** All analysis data stored securely in Qdrant
- **Encrypted Fields:** Sensitive data encrypted before storage
- **Access Control:** Standard authentication required
- **Audit Trail:** All MAS executions logged with timestamps

---

## API Status Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 200 | Success | Analysis completed successfully |
| 400 | Bad Request | Invalid student_id or query |
| 422 | Validation Error | Query too short (<5 chars) |
| 500 | Server Error | Unexpected error during analysis |

---

## Related Endpoints

- **POST /chat** - Individual chat analysis
- **POST /phq9** - PHQ-9 assessment submission
- **POST /drift** - Drift analysis
- **POST /studio** - Wellness recommendations
- **POST /memory/query** - Historical query search

---

## Future Enhancements

- **Real-time Agent Priority Adjustment:** Dynamic agent ordering based on concern level
- **Machine Learning Integration:** Predictive recommendations based on patterns
- **Custom Agent Chains:** User-defined agent execution sequences
- **Parallel Agent Optimization:** Concurrent agent execution for faster response times
- **Agent Feedback Loop:** Iterative refinement based on outcomes
- **Extended Agent Library:** Additional specialized agents (social, academic, physical)

