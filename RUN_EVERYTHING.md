# 🚀 RUN COMPLETE SYSTEM - Quick Start

**Time Required:** 5 minutes to start all services  
**Files Needed:** This guide + E2E_VERIFICATION_CHECKLIST.md

---

## 📍 FOLDER PATHS

Copy-paste ready paths:

```powershell
# Backend Folder
a:\Hachathon\New folder\mindset-x--main\mindset-x--main\backend copy

# Frontend Folder  
a:\Hachathon\New folder\mindset-x--main\mindset-x--main\mindset-safebio-vault-main
```

---

## 🎯 QUICK START (3 Steps)

### Step 1: Open 4 PowerShell Windows

| Terminal | Purpose |
|----------|---------|
| **T1** | Qdrant Server |
| **T2** | Backend (FastAPI) |
| **T3** | Frontend (React) |
| **T4** | Testing/Monitoring |

**How to open:**
```
Right-click desktop → Terminal as Administrator (repeat 4x)
OR
Press: Win + X → A (Admin PowerShell) - repeat 4x
```

---

### Step 2: Start Services

#### **Terminal 1: QDRANT**
```powershell
# Option A: Docker (if installed)
docker run -p 6333:6333 qdrant/qdrant

# Option B: Local executable (if qdrant-server installed)
qdrant-server

# Option C: If already running, skip this

# Verify: http://localhost:6333
```

**Expected Output:**
```
Qdrant is running on 0.0.0.0:6333
```

**✅ DONE - Move to Terminal 2**

---

#### **Terminal 2: BACKEND**
```powershell
# Navigate
cd "a:\Hachathon\New folder\mindset-x--main\mindset-x--main\backend copy"

# Activate Python environment
.\venv\Scripts\Activate.ps1

# Install dependencies (first time only)
pip install -r requirements.txt

# Start server
python main.py

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

**✅ DONE - Move to Terminal 3**

---

#### **Terminal 3: FRONTEND**
```powershell
# Navigate
cd "a:\Hachathon\New folder\mindset-x--main\mindset-x--main\mindset-safebio-vault-main"

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

**✅ DONE - Move to Terminal 4**

---

### Step 3: Open Browser

```
Navigate to: http://localhost:5173
```

**Expected to see:**
- MindSet X / Aura interface loads
- Navigation menu visible
- No red error messages in console (F12)

**✅ ALL SERVICES RUNNING**

---

## 🧪 TESTING SEQUENCE

### Phase 1: Chat (2 min)
```
1. Click: Chat tab
2. Type: "Hi, I'm feeling stressed about work"
3. Send message
4. ✅ Verify: AI response appears in < 2 seconds
5. Check F12 console: No errors
```

### Phase 2: PHQ-9 (3 min)
```
1. Click: Assessment tab
2. Answer all 9 questions (select 1 for each)
3. Click: Submit
4. ✅ Verify: Score appears (should be 9)
5. ✅ Verify: Severity shows "Mild"
```

### Phase 3: Drift (1 min)
```
1. Add another message in chat
2. Terminal 4: Run drift check (see below)
3. ✅ Verify: Drift analysis returns data
```

### Phase 4: Check Qdrant (1 min)
```
Terminal 4: 
curl http://localhost:6333/collections
# Should show data in collections
```

---

## 📊 QUICK TESTING COMMANDS (Terminal 4)

### Send Chat Message
```powershell
$body = @{
    message = "I'm feeling overwhelmed"
    student_id = "default"
} | ConvertTo-Json

curl -X POST http://localhost:8000/chat `
  -H "Content-Type: application/json" `
  -d $body
```

### Submit PHQ-9
```powershell
$body = @{
    scores = @(1, 1, 1, 1, 1, 1, 1, 0, 0)
    student_id = "default"
} | ConvertTo-Json

curl -X POST http://localhost:8000/phq9 `
  -H "Content-Type: application/json" `
  -d $body
```

### Check Drift
```powershell
$body = @{
    student_id = "default"
    include_chat = $true
    include_phq9 = $true
} | ConvertTo-Json

curl -X POST http://localhost:8000/drift `
  -H "Content-Type: application/json" `
  -d $body
```

### Check Qdrant Collections
```powershell
curl http://localhost:6333/collections
```

---

## ✅ VERIFICATION CHECKLIST

| Component | Status | Notes |
|-----------|--------|-------|
| Qdrant (6333) | ☐ | Running? |
| Backend (8000) | ☐ | No errors? |
| Frontend (5173) | ☐ | Page loads? |
| Chat works | ☐ | Response received? |
| PHQ-9 works | ☐ | Score calculated? |
| Drift works | ☐ | Analysis complete? |
| No console errors | ☐ | F12 console clear? |
| Qdrant has data | ☐ | Collections have points? |

---

## 🛑 TROUBLESHOOTING

### Port Already in Use

**Error:** `Address already in use`

**Fix:**
```powershell
# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess

# Kill it
Stop-Process -Id 12345 -Force

# Or use different port in main.py
# Change: uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Backend Won't Start

**Error:** `ModuleNotFoundError`

**Fix:**
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Install deps
pip install -r requirements.txt

# Try again
python main.py
```

### Frontend Won't Start

**Error:** `npm: command not found`

**Fix:**
```powershell
# Install Node.js from https://nodejs.org
# Then:
npm install
npm run dev
```

### API Calls Failing

**Error:** `"Connection refused"` or `"Failed to fetch"`

**Fix:**
```powershell
# Verify all services running
# Terminal 1: Qdrant ✅
# Terminal 2: Backend ✅
# Terminal 3: Frontend ✅

# Check backend logs for errors
# Terminal 2 should show:
# INFO:     Application startup complete
```

### No Data in Qdrant

**Expected:** After testing, should have points in collections

**Check:**
```powershell
curl http://localhost:6333/collections

# Should show:
# "chat_memory": { "points_count": 4 }
# "phq9_vectors": { "points_count": 1 }
```

**If empty:**
```powershell
# Check backend logs:
# - Is /chat being called?
# - Are responses showing "stored in Qdrant"?
# - Check vector_store.py for errors
```

---

## 📈 PERFORMANCE EXPECTATIONS

| Operation | Time | Unit |
|-----------|------|------|
| Chat message | 300-500 | ms |
| PHQ-9 submit | 300-500 | ms |
| Drift analysis | 800-1500 | ms |
| Qdrant query | 50-100 | ms |
| Page load | 1-3 | sec |

**If slower:**
- Check Terminal 2 for errors
- Verify Qdrant is running
- Check network connectivity

---

## 🎓 WHAT'S HAPPENING BEHIND THE SCENES

### Chat Flow
```
Frontend UI
   ↓ (send message)
FastAPI /chat endpoint
   ↓ (analyze sentiment)
TextBlob (sentiment analysis)
   ↓ (convert to vector)
embedding_service (384-dim vector)
   ↓ (store & search)
Qdrant (vector database)
   ↓ (get similar messages)
Generate response
   ↓ (send back)
Frontend displays response
```

### PHQ-9 Flow
```
Frontend form
   ↓ (submit scores 0-3 for each Q)
FastAPI /phq9 endpoint
   ↓ (sum scores, determine severity)
Score 0-27 range
   ↓ (convert to vector description)
embedding_service (384-dim vector)
   ↓ (store assessment)
Qdrant phq9_vectors collection
   ↓ (enable drift analysis)
Frontend shows score + severity
```

### Drift Detection Flow
```
User history (chat + PHQ-9)
   ↓ (retrieve from Qdrant)
drift_service
   ├─ Analyze sentiment trends
   ├─ Compare PHQ-9 scores
   └─ Calculate overall drift
   ↓ (0.0 = stable, 1.0 = critical)
Generate alert level (green/yellow/red)
   ↓ (send recommendations)
Frontend displays warnings
```

---

## 🚀 SUCCESS = All 3 Running + All Tests Pass

**If you see:**
- ✅ Qdrant: `Qdrant is running`
- ✅ Backend: `Application startup complete`
- ✅ Frontend: `Local: http://localhost:5173`
- ✅ Chat: Response in < 2 sec
- ✅ PHQ-9: Score calculated
- ✅ Drift: Analysis works

**YOU'RE DONE! 🎉**

---

## 📋 For Full Testing Details

See: `E2E_VERIFICATION_CHECKLIST.md`

Contains:
- Phase 1-6 testing procedures
- Expected outputs
- Verification steps
- Performance metrics
- Test report template

---

**Ready? Start with Terminal 1 and follow this guide! 🚀**
