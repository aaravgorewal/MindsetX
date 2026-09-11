# 🎯 SESSION HANDLING SYSTEM - READ THIS FIRST

## What This Is

A complete, production-ready user session tracking system for MindSet X. Every user gets a unique ID, and it's automatically sent with all API requests.

---

## ⚡ 3-Minute Setup

### Step 1: Update index.tsx
```tsx
import { SessionProvider } from './context/SessionContext';

root.render(
  <SessionProvider>
    <App />
  </SessionProvider>
);
```

### Step 2: Update Your Components
**Before:**
```tsx
const response = await axios.post('/api/chat', { message });
```

**After:**
```tsx
const { sendMessage, data } = useChatApi();
await sendMessage(message);
```

### Done! ✅
The user ID is now automatically included in all requests.

---

## 📚 Documentation Files

### 🚀 Getting Started (Start Here!)
- **[SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md)** - Complete guide with examples for every use case

### 💡 Quick Reference
- **[SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx)** - Copy-paste examples:
  - Chat interface
  - Assessment forms
  - Recommendations
  - Settings page
  - Memory search
  - Drift analysis

### 🧪 Testing & Debugging
- **[SESSION_TESTING_GUIDE.tsx](SESSION_TESTING_GUIDE.tsx)** - How to verify it's working:
  - Test session creation
  - Verify API requests
  - Check browser storage
  - Debug error scenarios

### 📋 Complete Reference
- **[SESSION_IMPLEMENTATION_COMPLETE.md](SESSION_IMPLEMENTATION_COMPLETE.md)** - Full technical details

---

## 🛠️ Core Files

| File | What it does |
|------|-------------|
| `context/SessionContext.tsx` | React Context for session data + hooks |
| `hooks/useApi.ts` | Custom hooks for all API calls |
| `services/sessionService.ts` | Session utilities |
| `services/apiClient.ts` | Axios client with interceptors |

---

## 🎯 Available Hooks

```tsx
// Session info
import { useSession, useUserId, useIsSessionValid } from '../context/SessionContext';

// API calls (user ID auto-included)
import {
  useChatApi,           // Chat messages
  useAssessmentApi,     // PHQ-9, GAD-7
  useStudioApi,         // Recommendations
  useMemoryApi,         // Search history
  useDriftApi           // Drift analysis
} from '../hooks/useApi';
```

---

## 💡 Quick Example

```tsx
import { useChatApi } from '../hooks/useApi';

export function ChatScreen() {
  const [message, setMessage] = useState('');
  const { sendMessage, data, loading, error } = useChatApi();

  const handleSend = async () => {
    try {
      // User ID is AUTOMATICALLY attached to request
      const response = await sendMessage(message);
      console.log('Bot replied:', response.reply);
      setMessage('');
    } catch (err) {
      console.error('Failed:', err.message);
    }
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
      {data && <p>{data.reply}</p>}
    </div>
  );
}
```

---

## ✅ How It Works

```
User opens app
    ↓
SessionProvider generates unique user ID
    ↓ (first load only, stored in localStorage)
User clicks a button to send message
    ↓
Component calls: useChatApi().sendMessage()
    ↓
Hook automatically adds user_id to request
    ↓
Backend receives request with X-User-ID header
    ↓
Backend logs user session
    ↓
Response sent back to component
    ↓
Component displays result
```

---

## 📱 User ID Format

- **Format:** `user_[UUID]_[TIMESTAMP]`
- **Example:** `user_a1b2c3d4-e5f6-7890_1704067200000`
- **Storage:** Browser's localStorage
- **Persistence:** Across page refreshes

---

## 🔍 Verify It's Working

### In Browser Console
```javascript
// Check user ID
console.log(localStorage.getItem('mindset_user_id'));
// Output: user_a1b2c3d4-e5f6-7890_1704067200000
```

### In DevTools Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Send an API request (e.g., click chat send)
4. Click on the request
5. Go to Headers tab
6. Look for: `X-User-ID: user_...`

---

## 🚀 All Available Hooks

### Session Hooks
```tsx
const { userId, isSessionValid, sessionStartTime, logout } = useSession();
const userId = useUserId();
const isValid = useIsSessionValid();
const duration = useSessionDuration();
```

### API Hooks
```tsx
// Chat
const { sendMessage, data, loading, error } = useChatApi();
await sendMessage("Hello!");

// Assessment
const { submitPhq9, data, loading, error } = useAssessmentApi();
await submitPhq9([0, 1, 2, 1, 0, 1, 2, 1, 0]);

// Studio (recommendations)
const { getPersonalizedFeed, data, loading, error } = useStudioApi();
await getPersonalizedFeed('anxious', undefined, 'beginner', 10);

// Memory (search)
const { queryMemory, data, loading, error } = useMemoryApi();
await queryMemory('query', 'hybrid', 5, 0.4);

// Drift Analysis
const { analyzeDrift, data, loading, error } = useDriftApi();
await analyzeDrift(true, true);
```

---

## 🎓 Common Patterns

### Display User ID
```tsx
import { useUserId } from '../context/SessionContext';

export function Header() {
  const userId = useUserId();
  return <p>User: {userId.slice(0, 12)}...</p>;
}
```

### Show Session Status
```tsx
import { useSession } from '../context/SessionContext';

export function Settings() {
  const { userId, isSessionValid, logout } = useSession();
  
  return (
    <div>
      <p>Status: {isSessionValid ? '✅ Active' : '❌ Expired'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Handle Errors
```tsx
const { sendMessage, loading, error, data } = useChatApi();

if (error) {
  return <div style={{ color: 'red' }}>Error: {error.message}</div>;
}

if (loading) {
  return <div>Loading...</div>;
}

if (data) {
  return <div>{data.reply}</div>;
}
```

---

## 🐛 Troubleshooting

**Q: User ID not showing in localStorage?**
A: Make sure SessionProvider wraps your App in index.tsx

**Q: X-User-ID header not in requests?**
A: Use custom hooks (useChatApi, etc.) instead of raw axios

**Q: Session expires too fast?**
A: Session is valid for 24 hours - this is expected

**Q: API calls still failing?**
A: Check backend is running and responding to requests

---

## 📖 Next Steps

1. **Read** [SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md) - Full guide
2. **Copy** examples from [SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx) - Paste into your components
3. **Test** using [SESSION_TESTING_GUIDE.tsx](SESSION_TESTING_GUIDE.tsx) - Verify it works
4. **Deploy** - Push to production

---

## 🎉 That's It!

Your app now has user session tracking. Every request includes a unique user ID that the backend can use to identify and log user activity.

**Need more help?** Check the comprehensive guides in the files above.

