# Session Handling Implementation - Complete Summary

## 🎯 What Was Implemented

A complete, production-ready session handling system that:
- ✅ Generates unique user IDs on first app load
- ✅ Persists user IDs across page refreshes
- ✅ Automatically includes user ID with every API request
- ✅ Validates session validity (24-hour expiry)
- ✅ Provides React Context for accessing session data
- ✅ Includes custom hooks for all API calls
- ✅ Handles errors gracefully
- ✅ Fully TypeScript compliant

---

## 📁 Files Created

### Core Infrastructure (4 files)
| File | Purpose |
|------|---------|
| [context/SessionContext.tsx](context/SessionContext.tsx) | React Context for session state + hooks |
| [hooks/useApi.ts](hooks/useApi.ts) | Custom hooks for all API calls |
| [services/sessionService.ts](services/sessionService.ts) | Session utilities & management |
| [services/apiClient.ts](services/apiClient.ts) | Axios client with interceptors |

### Documentation & Examples (3 files)
| File | Purpose |
|------|---------|
| [SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx) | Copy-paste examples for all components |
| [SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md) | Comprehensive integration guide |
| [SESSION_TESTING_GUIDE.tsx](SESSION_TESTING_GUIDE.tsx) | Testing & validation procedures |

---

## 🚀 Quick Integration

### Step 1: Add SessionProvider (index.tsx)
```tsx
import { SessionProvider } from './context/SessionContext';

root.render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>
);
```

### Step 2: Use Custom Hooks in Components
```tsx
import { useChatApi } from '../hooks/useApi';

const { sendMessage, data, loading, error } = useChatApi();
await sendMessage("Hello!");
```

**That's it! User ID is now auto-attached to all requests.**

---

## 🔧 How It Works

### User ID Generation
- **Format**: `user_[UUID]_[TIMESTAMP]`
- **Example**: `user_a1b2c3d4-e5f6-7890_1704067200000`
- **Storage**: `localStorage['mindset_user_id']`
- **Persistence**: Across page refreshes and browser sessions

### Request Flow
```
Component Request
    ↓
Custom Hook (useChatApi, etc.)
    ↓
apiClient (axios instance)
    ↓
Request Interceptor
    ↓ (adds X-User-ID header + user_id to body)
Backend API
    ↓
Response Interceptor
    ↓ (handles errors)
Hook returns data
    ↓
Component renders result
```

### Session Validation
- **Duration**: 24 hours
- **Start**: `localStorage['mindset_session_start']`
- **Check**: Automatic on context initialization
- **Expiry Action**: Generate new user ID + session

---

## 📡 API Hooks Available

```tsx
// Chat
const { sendMessage, data, loading, error } = useChatApi();
await sendMessage("message");

// Assessment (PHQ-9, GAD-7, etc.)
const { submitPhq9, submitGad7, data, loading, error } = useAssessmentApi();
await submitPhq9([0, 1, 2, 1, 0, 1, 2, 1, 0]);

// Studio (recommendations)
const { getPersonalizedFeed, getCategories, data, loading, error } = useStudioApi();
await getPersonalizedFeed('anxious', undefined, 'beginner', 10);

// Memory (vector search)
const { queryMemory, data, loading, error } = useMemoryApi();
await queryMemory('query', 'hybrid', 5, 0.4);

// Drift Analysis
const { analyzeDrift, data, loading, error } = useDriftApi();
await analyzeDrift(true, true);
```

---

## 📝 Session Context API

```tsx
// Get full session object
const session = useSession();
// {
//   userId: "user_a1b2c3d4_...",
//   isSessionValid: true,
//   sessionStartTime: 1704067200000,
//   sessionDurationMs: 3600000,
//   logout: () => void
// }

// Or use individual hooks
const userId = useUserId();
const isValid = useIsSessionValid();
const duration = useSessionDuration();

// Logout
const { logout } = useSession();
logout(); // Clears localStorage + context
```

---

## 🔍 Verification Checklist

### In Browser Console
```javascript
// 1. Check user ID
console.log(localStorage.getItem('mindset_user_id'));
// Output: user_a1b2c3d4-e5f6-7890_1704067200000

// 2. Check session context
import { getSessionInfo } from './services/sessionService';
console.log(getSessionInfo());
```

### In DevTools Network Tab
```
GET /api/chat
Headers:
  X-User-ID: user_a1b2c3d4-e5f6-7890_1704067200000
  Content-Type: application/json

Body:
  {
    "user_id": "user_a1b2c3d4-e5f6-7890_1704067200000",
    "message": "Hello"
  }
```

---

## 🛠️ Backend Integration

### Expected Request Format
**Header:**
- `X-User-ID: user_[UUID]_[TIMESTAMP]`

**Body:**
- Include `user_id` field

### Example Backend Processing
```python
# Flask example
@app.route('/api/chat', methods=['POST'])
def chat():
    user_id = request.headers.get('X-User-ID')
    # OR
    user_id = request.json.get('user_id')
    
    message = request.json.get('message')
    
    # Log user activity
    log_user_session(user_id, 'chat', message)
    
    # Process message
    response = process_chat(user_id, message)
    
    return jsonify(response)
```

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| **Automatic ID Generation** | Creates on first load, never manually needed |
| **Persistent Across Refreshes** | localStorage keeps user ID even after page reload |
| **Auto Header Injection** | User ID added to all requests automatically |
| **Session Validation** | 24-hour expiry with auto-renewal |
| **React Integration** | Full Context API + Hooks support |
| **Type Safety** | 100% TypeScript |
| **Error Handling** | Graceful error messages for all scenarios |
| **Testing Support** | Debug components + testing procedures included |

---

## 🎓 Component Examples

### Chat Interface
```tsx
import { useChatApi } from '../hooks/useApi';

export const ChatInterface = () => {
  const { sendMessage, data, loading } = useChatApi();
  
  const handleSend = async (msg: string) => {
    const response = await sendMessage(msg);
    console.log(response.reply);
  };
  
  return <button onClick={() => handleSend('Hi')}>Send</button>;
};
```

### Assessment Form
```tsx
import { useAssessmentApi } from '../hooks/useApi';

export const PHQ9 = () => {
  const { submitPhq9, data } = useAssessmentApi();
  
  const handleSubmit = async (scores: number[]) => {
    const result = await submitPhq9(scores);
    console.log('Score:', result.totalScore);
  };
  
  return <button onClick={() => handleSubmit([1,2,1,0,1,2,1,0,1])}>Submit</button>;
};
```

### Session Display
```tsx
import { useSession } from '../context/SessionContext';

export const UserProfile = () => {
  const { userId, isSessionValid, logout } = useSession();
  
  return (
    <div>
      <p>ID: {userId}</p>
      <p>Status: {isSessionValid ? '✅ Active' : '❌ Expired'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│           React Application                      │
│  ┌──────────────────────────────────────────┐  │
│  │      SessionProvider (Context)           │  │
│  │  - Generates/manages user_id             │  │
│  │  - Validates session (24h)               │  │
│  │  - Provides session hooks                │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                             │
│  ┌──────────────────────────────────────────┐  │
│  │     Custom Hooks (useChat, useAssessment)   │  │
│  │  - Wrap API calls                        │  │
│  │  - Handle loading/error states           │  │
│  │  - Manage data                           │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                             │
│  ┌──────────────────────────────────────────┐  │
│  │     apiClient (axios with interceptors)  │  │
│  │  - Injects X-User-ID header              │  │
│  │  - Adds user_id to request body          │  │
│  │  - Handles errors                        │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓ (HTTP)
        ┌──────────────────────┐
        │    Backend API       │
        │  - Receives user_id  │
        │  - Logs user session │
        │  - Processes request │
        │  - Returns response  │
        └──────────────────────┘
```

---

## 🔐 Data Flow Example: Chat Request

```
1. User types message in ChatInterface
   ↓
2. Component calls: useChatApi().sendMessage(message)
   ↓
3. Hook retrieves user_id from context: "user_a1b2c3d4_1704067200000"
   ↓
4. Hook prepares request:
   POST /api/chat
   Headers: {
     "X-User-ID": "user_a1b2c3d4_1704067200000",
     "Content-Type": "application/json"
   }
   Body: {
     "user_id": "user_a1b2c3d4_1704067200000",
     "message": "Hello"
   }
   ↓
5. Request interceptor adds headers (already done by hook)
   ↓
6. Sent to backend
   ↓
7. Backend logs: "user_a1b2c3d4_1704067200000 sent: Hello"
   ↓
8. Backend processes and responds:
   {
     "reply": "I'm here to help..."
   }
   ↓
9. Response interceptor handles success
   ↓
10. Hook returns data to component
    ↓
11. Component re-renders with response
```

---

## 🚨 Error Handling

All hooks follow consistent error handling:

```tsx
const { sendMessage, loading, error, data } = useChatApi();

// Option 1: Using error state
if (error) {
  return <div>Error: {error.message}</div>;
}

// Option 2: Using try-catch
try {
  const response = await sendMessage(message);
} catch (err: any) {
  console.error(err.message);
}

// Common errors:
// - NetworkError: Backend not reachable
// - ValidationError: Invalid input
// - AuthenticationError: Session expired
// - ServerError: Backend returned 500
```

---

## 📞 Support & Troubleshooting

### Issue: User ID Not Generated
**Solution:**
1. Check SessionProvider wraps App in index.tsx
2. Open DevTools console for errors
3. Clear localStorage and reload

### Issue: X-User-ID Header Missing
**Solution:**
1. Verify using custom hooks (not raw axios)
2. Check Network tab headers
3. Ensure apiClient.ts is imported correctly

### Issue: Session Expires Too Quickly
**Solution:**
1. Check SESSION_DURATION_MS in sessionService.ts (should be 24h)
2. Verify system time is correct
3. Check backend isn't forcing expiry

### Issue: Data Not Displaying
**Solution:**
1. Check backend API is responding
2. Verify response format matches schema
3. Check browser console for errors
4. Test with debug component

---

## ✅ Next Steps

1. **Wrap App** - Add SessionProvider to index.tsx
2. **Update Components** - Replace raw axios with custom hooks
3. **Test** - Use SessionDebug component to verify
4. **Monitor** - Check backend logs for user_id
5. **Deploy** - Push to production

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md) | Complete integration guide with examples |
| [SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx) | Copy-paste code snippets |
| [SESSION_TESTING_GUIDE.tsx](SESSION_TESTING_GUIDE.tsx) | Testing & debugging procedures |

---

## 🎉 You're All Set!

The session handling system is ready to use. Follow the integration steps above and your app will have full user session tracking with automatic user ID management.

**Questions?** Check the comprehensive guides above or review the inline code comments in the implementation files.

