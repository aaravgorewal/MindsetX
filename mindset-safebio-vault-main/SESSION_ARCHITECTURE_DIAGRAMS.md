# Session Handling System - Visual Architecture

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              MindSet X Application (React + TypeScript)         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  SessionProvider                          │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  • Initializes user_id on app load                        │ │
│  │  • Stores in localStorage                                 │ │
│  │  • Validates session (24h expiry)                         │ │
│  │  • Provides React Context with session data               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                      │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          Components (ChatInterface, etc.)               │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  import { useChatApi } from '../hooks/useApi'           │  │
│  │                                                          │  │
│  │  const { sendMessage, data, loading } = useChatApi();   │  │
│  │  await sendMessage("Hello");                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          Custom Hooks (useApi.ts)                       │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  • useChatApi()                                          │  │
│  │  • useAssessmentApi()                                    │  │
│  │  • useStudioApi()                                        │  │
│  │  • useMemoryApi()                                        │  │
│  │  • useDriftApi()                                         │  │
│  │                                                          │  │
│  │  (All automatically include user_id)                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          apiClient.ts (Axios + Interceptors)            │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  • Request Interceptor:                                  │  │
│  │    - Adds X-User-ID header                               │  │
│  │    - Adds user_id to request body                        │  │
│  │                                                          │  │
│  │  • Response Interceptor:                                 │  │
│  │    - Handles errors                                      │  │
│  │    - Validates response                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ↓                    ↓
          ┌──────────────────┐  ┌──────────────────┐
          │  localStorage    │  │   Network        │
          │  ━━━━━━━━━━━━━━ │  │  (HTTP Request)  │
          │ mindset_user_id │  │  ━━━━━━━━━━━━━━  │
          │ mindset_session │  │ POST /api/chat   │
          │ _start           │  │ Headers:         │
          │                  │  │  X-User-ID: ...  │
          └──────────────────┘  │ Body: user_id... │
                                 └──────────────────┘
                                       │
                                       ↓
                            ┌────────────────────────┐
                            │   Backend API Server   │
                            │  ━━━━━━━━━━━━━━━━━━━  │
                            │ • Receives user_id     │
                            │ • Logs user session    │
                            │ • Processes request    │
                            │ • Returns response     │
                            └────────────────────────┘
```

---

## 📊 Request Flow Diagram

```
┌─ START: User sends message ─────────────────────────────────────┐
│                                                                  │
│  User clicks "Send" button                                      │
│           │                                                     │
│           ↓                                                     │
│  Component: ChatInterface.tsx                                  │
│    const { sendMessage } = useChatApi();                       │
│           │                                                     │
│           ↓                                                     │
│  Hook: useChatApi() (in hooks/useApi.ts)                       │
│    • Gets user_id from useContext(SessionContext)              │
│    • Calls apiClient.post('/api/chat', {                       │
│        user_id: "user_a1b2c3d4_1704067200000",                 │
│        message: "Hello"                                         │
│      })                                                         │
│           │                                                     │
│           ↓                                                     │
│  Request Interceptor (in apiClient.ts)                         │
│    • Adds header: X-User-ID: user_a1b2c3d4_...                 │
│    • Adds body.user_id already present ✓                        │
│           │                                                     │
│           ↓                                                     │
│  Network Request (HTTP)                                        │
│    POST /api/chat                                               │
│    Headers: {                                                   │
│      "X-User-ID": "user_a1b2c3d4_1704067200000",               │
│      "Content-Type": "application/json"                         │
│    }                                                            │
│    Body: {                                                      │
│      "user_id": "user_a1b2c3d4_1704067200000",                 │
│      "message": "Hello"                                         │
│    }                                                            │
│           │                                                     │
│           ↓                                                     │
│  Backend API Server                                            │
│    app.post('/api/chat', (req) => {                             │
│      const user_id = req.headers['x-user-id'];                 │
│      // OR                                                      │
│      const user_id = req.body.user_id;                         │
│                                                                  │
│      // Log user session                                        │
│      log(user_id, 'sent message: Hello');                      │
│                                                                  │
│      // Process message                                         │
│      const reply = process_message(user_id, 'Hello');          │
│                                                                  │
│      // Send response                                           │
│      return { reply: "Hi there!" };                             │
│    })                                                           │
│           │                                                     │
│           ↓                                                     │
│  Network Response (HTTP)                                       │
│    200 OK                                                       │
│    Body: {                                                      │
│      "reply": "Hi there!"                                       │
│    }                                                            │
│           │                                                     │
│           ↓                                                     │
│  Response Interceptor (in apiClient.ts)                        │
│    • Validates response status                                 │
│    • Handles errors if any                                     │
│           │                                                     │
│           ↓                                                     │
│  Hook: useChatApi() returns data                               │
│    • Sets data: { reply: "Hi there!" }                         │
│    • Sets loading: false                                        │
│    • Sets error: null                                           │
│           │                                                     │
│           ↓                                                     │
│  Component: ChatInterface.tsx                                  │
│    • Re-renders with new data                                  │
│    • Shows reply: "Hi there!"                                  │
│           │                                                     │
│           ↓                                                     │
│  User sees response on screen ✓                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Session Lifecycle

```
┌─ APP INITIALIZATION ─────────────────────────────────────────────┐
│                                                                  │
│  1. User opens app (http://localhost:3000)                      │
│                                                                  │
│  2. React loads index.tsx                                       │
│     └─ SessionProvider wraps <App />                            │
│                                                                  │
│  3. SessionProvider initializes:                                │
│     ├─ Check localStorage['mindset_user_id']                    │
│     │  ├─ If exists and valid (< 24h):                         │
│     │  │  └─ Use existing user_id ✓                            │
│     │  └─ If missing or expired:                                │
│     │     ├─ Generate new: user_[UUID]_[TIMESTAMP]             │
│     │     ├─ Store in localStorage                              │
│     │     └─ Set sessionStart = now                             │
│     │                                                           │
│     └─ Create React Context with session data                   │
│                                                                  │
│  4. App renders and is ready ✓                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
mindset-safebio-vault-main/
│
├── context/
│   └── SessionContext.tsx ..................... React Context + Hooks
│       • useSession()
│       • useUserId()
│       • useIsSessionValid()
│       • useSessionDuration()
│
├── hooks/
│   └── useApi.ts .............................. Custom API Hooks
│       • useChatApi()
│       • useAssessmentApi()
│       • useStudioApi()
│       • useMemoryApi()
│       • useDriftApi()
│
├── services/
│   ├── sessionService.ts ...................... Session Utilities
│   │   • getOrCreateUserId()
│   │   • getSessionInfo()
│   │   • formatSessionDuration()
│   │   • isSessionValid()
│   │
│   └── apiClient.ts ........................... Axios Client
│       • Request interceptor
│       • Response interceptor
│       • Error handling
│
├── index.tsx ................................. Entry Point
│   └── Wrap with <SessionProvider>
│
├── components/
│   ├── ChatInterface.tsx ....................... Example component
│   ├── Header.tsx .............................. Display user ID
│   ├── SettingsScreen.tsx ...................... Show session info
│   └── ... (other components using hooks)
│
└── Documentation/
    ├── README_SESSION_HANDLING.md ............. START HERE
    ├── SESSION_INTEGRATION_GUIDE.md ........... Complete guide
    ├── SESSION_QUICK_START.tsx ................ Copy-paste examples
    ├── SESSION_TESTING_GUIDE.tsx .............. Test procedures
    └── SESSION_IMPLEMENTATION_COMPLETE.md .... Full reference
```

---

## 🔐 Data Security Flow

```
┌─────────────────────────────────────────────────────────┐
│  User ID Generation                                     │
├─────────────────────────────────────────────────────────┤
│  Format: user_[UUID]_[TIMESTAMP]                        │
│                                                         │
│  UUID (v4): Cryptographically random identifier         │
│  TIMESTAMP: Current time in milliseconds                │
│                                                         │
│  Example: user_a1b2c3d4-e5f6-7890_1704067200000         │
│                                                         │
│  ✓ Unique across all users                              │
│  ✓ Not guessable or predictable                         │
│  ✓ Includes timestamp for session tracking              │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Storage (localStorage)                                 │
├─────────────────────────────────────────────────────────┤
│  key: mindset_user_id                                   │
│  value: user_a1b2c3d4-e5f6-7890_1704067200000           │
│                                                         │
│  key: mindset_session_start                             │
│  value: 1704067200000 (timestamp)                       │
│                                                         │
│  ✓ Persists across page refreshes                       │
│  ✓ Persists across browser sessions                     │
│  ✓ Only accessible within same domain                   │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Network Transmission                                   │
├─────────────────────────────────────────────────────────┤
│  Method 1: Request Header                               │
│  X-User-ID: user_a1b2c3d4-e5f6-7890_1704067200000       │
│                                                         │
│  Method 2: Request Body                                 │
│  { "user_id": "user_a1b2c3d4...", ... }                 │
│                                                         │
│  ✓ Sent with every API request                          │
│  ✓ Can be logged by backend                             │
│  ✓ Use HTTPS for encryption in transit                  │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Backend Processing                                     │
├─────────────────────────────────────────────────────────┤
│  1. Receive request with X-User-ID header               │
│  2. Validate user_id format                             │
│  3. Log user activity with timestamp                    │
│  4. Process user-specific operations                    │
│  5. Store in database with user_id association          │
│                                                         │
│  ✓ All user actions tracked to their user_id            │
│  ✓ Enable personalized recommendations                  │
│  ✓ Monitor user mental health trends                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Integration Checklist

```
☐ Copy all 4 core files to your project:
  ☐ context/SessionContext.tsx
  ☐ hooks/useApi.ts
  ☐ services/sessionService.ts
  ☐ services/apiClient.ts

☐ Update index.tsx:
  ☐ Import SessionProvider
  ☐ Wrap <App /> with <SessionProvider>

☐ Update Components:
  ☐ Replace raw axios with custom hooks
  ☐ Use useChatApi() for chat
  ☐ Use useAssessmentApi() for assessments
  ☐ Use useStudioApi() for recommendations
  ☐ Use useMemoryApi() for search
  ☐ Use useDriftApi() for drift analysis

☐ Test:
  ☐ Check localStorage for user_id
  ☐ Verify X-User-ID header in Network tab
  ☐ Confirm data flows correctly
  ☐ Test error scenarios

☐ Deploy:
  ☐ Push to production
  ☐ Monitor backend logs for user_id
  ☐ Verify user tracking working
```

---

## 📞 Quick Reference

**All Available Hooks:**
```
Session: useSession, useUserId, useIsSessionValid, useSessionDuration
API: useChatApi, useAssessmentApi, useStudioApi, useMemoryApi, useDriftApi
```

**User ID Format:**
```
user_[UUID]_[TIMESTAMP]
Example: user_a1b2c3d4-e5f6-7890_1704067200000
```

**Request Headers:**
```
X-User-ID: user_a1b2c3d4-e5f6-7890_1704067200000
Content-Type: application/json
```

**Session Duration:**
```
24 hours (1440 minutes)
Auto-renewal on expiry
```

---

## 🎉 Complete!

Your session handling system is ready to use. Follow the integration checklist above and you're all set!

