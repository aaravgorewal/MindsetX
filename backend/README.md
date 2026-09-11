# MindSet-X Backend (Aura Clinical AI)

Vector-based mental wellness analysis API with Qdrant Cloud, multi-agent orchestration, and secure bio-vault storage.

---

## Quick Start

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Download TextBlob corpora (one-time)
python -m textblob.download_corpora

# Run the server
python main.py
# → http://localhost:8000  |  Docs → http://localhost:8000/docs
```

### Environment Variables (`.env`)

```
QDRANT_URL=https://<your-cluster>.qdrant.io:6333
QDRANT_API_KEY=<your-api-key>
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
FRONTEND_URLS=http://localhost:3000,http://localhost:5173   # optional, defaults shown
```

---

## Architecture

```
main.py
├── /chat        → MASOrchestrator.process_chat()
│                    ├── Archivist  (store + retrieve similar messages)
│                    ├── Auditor    (cosine-similarity drift detection)
│                    └── Strategist (rule-based response + action list)
├── /phq9        → PHQ-9 assessment → severity + Qdrant storage
├── /drift       → drift_service  (batch chat + PHQ-9 trend analysis)
├── /memory      → memory_service (hybrid semantic search)
├── /studio/*    → studio_service (wellness content feed)
├── /admin/*     → admin_dashboard (heatmaps, engagement metrics)
└── /bio-vault/* → SafeBio (encrypted biometric storage + consent)
```

**Vector collections** (all in Qdrant Cloud):

| Collection | Purpose |
|---|---|
| `chat_memory` | Per-message embeddings for drift baseline |
| `phq9_vectors` | PHQ-9 assessment embeddings |
| `wellness_content` | Studio content (curated wellness resources) |
| `bio_consent_logs` | Encrypted biometric metadata + consent audit |

---

## Core API Reference

### `POST /chat`
Run the full MAS pipeline on a user message.

**Request**
```json
{
  "message": "I've been feeling really anxious lately",
  "session_id": "optional-uuid"
}
```

**Response** (`data` fields)
```json
{
  "status": "success",
  "data": {
    "reply":       "It looks like stress is increasing. Try these steps.",
    "sentiment":   -0.45,
    "drift_score": 0.62,
    "drift_state": "early_warning",
    "actions":     ["journaling_prompt", "sleep_hygiene", "soft_counselor_prompt"],
    "message_id":  "uuid",
    "session_id":  "uuid"
  },
  "drift_state": "drifting"
}
```

Drift states: `stable` (>0.8 similarity) · `early_warning` (0.4–0.8) · `high_risk` (<0.4) · `no_history` (first message)

---

### `POST /phq9`
Store and score a 9-question PHQ-9 assessment.

```json
{ "scores": [0,1,2,1,0,1,0,1,0], "student_id": "STU123" }
```

---

### `POST /drift`
Batch drift analysis across chat + PHQ-9 history.

```json
{ "student_id": "STU123", "include_chat": true, "include_phq9": true }
```

---

### `POST /memory/query`
Semantic search across stored sessions.

```json
{ "query": "anxiety sleep problems", "student_id": "STU123", "limit": 5 }
```

---

### `GET /studio/feed`  ·  `POST /studio/feed`
Personalised wellness content feed.

---

### `POST /bio-vault/upload`  ·  `POST /bio-vault/consent`
Encrypted biometric data upload and consent management (Fernet AES encryption).

---

### `GET /admin/heatmap`  ·  `GET /admin/trends`  ·  `GET /admin/engagement`
Admin dashboard analytics.

---

### `GET /` — Health check

---

## Agent Summary

| Agent | Class | Role |
|---|---|---|
| `Archivist` | `agents/archivist.py` | Store + retrieve chat history from Qdrant |
| `Auditor` | `agents/auditor.py` | Cosine-drift detection + compliance checks |
| `Strategist` | `agents/strategist.py` | Map drift state → reply + action list |
| `SafeBioAgent` | `agents/safebio.py` | Biometric consent validation + risk scoring |
| `MASOrchestrator` | `agents/orchestrator.py` | Pipeline coordinator |

---

## Test Server Startup

```bash
python -c "import main; print('✅ Imports OK')"

# Quick /chat smoke test
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I have been feeling stressed and anxious","session_id":"test-001"}' \
  | python -m json.tool
```

---

## Key Files

```
backend/
├── main.py                  # FastAPI app + all route handlers
├── agents/
│   ├── orchestrator.py      # MASOrchestrator (pipeline entry point)
│   ├── archivist.py         # Memory storage + retrieval
│   ├── auditor.py           # Drift detection + compliance
│   ├── strategist.py        # Response strategy selection
│   └── safebio.py           # Biometric consent + risk
├── embedding_service.py     # SentenceTransformer embeddings (all-MiniLM-L6-v2)
├── vector_store.py          # Qdrant collection management
├── drift_service.py         # Batch drift analytics
├── memory_service.py        # Hybrid semantic memory search
├── studio_service.py        # Wellness content (Studio feed)
├── admin_dashboard.py       # Admin analytics service
├── unified_response.py      # Unified API response schema
├── qdrant_cloud_config.py   # Qdrant Cloud connection config
├── requirements.txt
└── .env                     # Never commit — see .gitignore
```
