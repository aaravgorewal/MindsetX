# Session Handling Integration Guide

## Overview

This guide explains how session handling has been implemented in the MindSet X application. Every API request now automatically includes the user's session ID.

---

## 📋 Files Created/Modified

### Core Session Management
- **[context/SessionContext.tsx](context/SessionContext.tsx)** - React context for session state
- **[hooks/useApi.ts](hooks/useApi.ts)** - Custom hooks for API requests with auto user_id
- **[services/sessionService.ts](services/sessionService.ts)** - Session utilities
- **[services/apiClient.ts](services/apiClient.ts)** - Axios client with interceptors

### Integration Examples
- **[SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx)** - Copy-paste examples for your components

---

## 🚀 Quick Start (3 Steps)

### Step 1: Wrap App with SessionProvider
Edit your `index.tsx`:

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

### Step 2: Use Custom Hooks for API Calls
Instead of making raw axios calls, use the custom hooks:

```tsx
import { useChatApi, useAssessmentApi, useStudioApi } from '../hooks/useApi';

// In your component:
const { sendMessage, data, loading, error } = useChatApi();
```

### Step 3: That's It!
The user_id is now automatically attached to all requests.

---

## 📡 API Integration Details

### How It Works

1. **User ID Generation** (on first load)
   - Format: `user_UUID_TIMESTAMP`
   - Stored in: `localStorage['mindset_user_id']`
   - Reused across sessions

2. **Request Interception**
   - Every API request is intercepted
   - User ID is added to request header: `X-User-ID: user_...`
   - User ID is added to request body: `user_id: user_...`

3. **Session Validation**
   - Stored: `localStorage['mindset_session_start']`
   - Validity: 24 hours
   - Auto-cleanup: Expired sessions trigger new user_id

---

## 🛠️ Available Hooks

### Session Context Hooks
```tsx
import {
  useSession,           // Full session object
  useUserId,           // Just the user ID string
  useIsSessionValid,   // Boolean validity
  useSessionDuration,  // Duration in milliseconds
} from '../context/SessionContext';

const session = useSession();
const userId = useUserId();
const isValid = useIsSessionValid();
const duration = useSessionDuration();
```

### API Hooks
```tsx
import {
  useChatApi,           // Chat messages
  useAssessmentApi,     // PHQ-9, GAD-7, etc.
  useMemoryApi,         // Vector search
  useStudioApi,         // Content recommendations
  useDriftApi,          // Drift analysis
} from '../hooks/useApi';
```

#### useChatApi
```tsx
const { 
  sendMessage,    // (message: string) => Promise<Response>
  data,           // Latest response
  loading,        // Boolean
  error           // Error object | null
} = useChatApi();

await sendMessage("Hello, I'm feeling anxious");
```

#### useAssessmentApi
```tsx
const {
  submitPhq9,     // (scores: number[]) => Promise<Response>
  submitGad7,     // (scores: number[]) => Promise<Response>
  data,
  loading,
  error
} = useAssessmentApi();

await submitPhq9([0, 1, 2, 1, 0, 1, 2, 1, 0]);
```

#### useStudioApi
```tsx
const {
  getPersonalizedFeed,  // (mood, category?, difficulty?, limit?) => Promise
  getCategories,        // () => Promise
  data,
  loading,
  error
} = useStudioApi();

await getPersonalizedFeed('anxious', undefined, 'beginner', 10);
```

#### useMemoryApi
```tsx
const {
  queryMemory,    // (query, type, limit?, threshold?) => Promise
  data,           // { total_found, results }
  loading,
  error
} = useMemoryApi();

await queryMemory('feeling overwhelmed', 'hybrid', 5, 0.4);
```

#### useDriftApi
```tsx
const {
  analyzeDrift,   // (check_pattern?, check_mental_state?) => Promise
  data,           // { overall_drift_score, alert_level, recommendations }
  loading,
  error
} = useDriftApi();

await analyzeDrift(true, true);
```

---

## 📝 Component Examples

### Chat Component
```tsx
import { useChatApi } from '../hooks/useApi';

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, loading, data, error } = useChatApi();

  const handleSend = async () => {
    const response = await sendMessage(message);
    console.log('Bot replied:', response.reply);
    setMessage('');
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
      />
      <button onClick={handleSend} disabled={loading}>
        Send
      </button>
      {data && <p>{data.reply}</p>}
    </div>
  );
};
```

### Assessment Component
```tsx
import { useAssessmentApi } from '../hooks/useApi';

export const PHQ9Form: React.FC = () => {
  const [scores, setScores] = useState<number[]>(Array(9).fill(0));
  const { submitPhq9, loading, data } = useAssessmentApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitPhq9(scores);
    console.log('PHQ-9 Score:', result.totalScore);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>Submit</button>
      {data && <p>Score: {data.totalScore}</p>}
    </form>
  );
};
```

### Session Info Display
```tsx
import { useSession } from '../context/SessionContext';

export const UserProfile: React.FC = () => {
  const { userId, isSessionValid, sessionStartTime, logout } = useSession();

  return (
    <div>
      <p>User ID: {userId}</p>
      <p>Status: {isSessionValid ? 'Active' : 'Expired'}</p>
      <p>Started: {new Date(sessionStartTime).toLocaleString()}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

## 🔍 Debugging & Verification

### Check Session in Browser Console
```javascript
// Get session info
import { getSessionInfo } from './services/sessionService';
console.log(getSessionInfo());

// Output:
// {
//   userId: "user_a1b2c3d4_1234567890",
//   sessionStart: 1234567890000,
//   sessionDuration: 3600000,
//   isValid: true
// }

// Check localStorage
console.log('User ID:', localStorage.getItem('mindset_user_id'));
console.log('Session Start:', localStorage.getItem('mindset_session_start'));
```

### Check API Requests
1. Open DevTools (F12)
2. Go to **Network** tab
3. Send an API request
4. Click on the request
5. Go to **Headers** tab
6. Look for: `X-User-ID: user_...`

### Network Inspection
```
Request Headers:
X-User-ID: user_a1b2c3d4_1234567890
Content-Type: application/json

Request Body:
{
  "user_id": "user_a1b2c3d4_1234567890",
  "message": "Hello",
  ...
}
```

---

## 🔐 Session Lifecycle

### Creation
1. App loads → SessionProvider initializes
2. No user_id in localStorage? → Generate new one
3. Store in localStorage + context
4. User ID persists across page refreshes

### Validation
- Session is valid for **24 hours**
- After 24 hours → Auto generate new user_id
- Automatic background validation

### Cleanup
- Session expires after 24 hours
- `useSession().logout()` → Clears all session data
- New session starts on next app load

---

## 🚨 Error Handling

All API hooks follow the same pattern:

```tsx
const { sendMessage, loading, error, data } = useChatApi();

try {
  const response = await sendMessage(message);
} catch (err) {
  console.error('API Error:', err.message);
  // Handle error
}

// Or use the hook's error state
if (error) {
  <div className="error">
    {error.message || 'Something went wrong'}
  </div>
}
```

### Common Error Types
- `NetworkError` - No internet/backend down
- `ValidationError` - Invalid input
- `AuthenticationError` - Session expired
- `ServerError` - Backend error (500, etc.)

---

## 📊 Backend Integration

### Expected Headers
Backend should look for:
- **Header**: `X-User-ID`
- **Body**: `user_id` field

### Expected Response Format
All API responses should be compatible with our hooks:

**Chat**
```json
{
  "reply": "string",
  "confidence": 0.95
}
```

**Assessment**
```json
{
  "totalScore": 15,
  "severity": "mild"
}
```

**Studio/Recommendations**
```json
{
  "content": [
    {
      "vector_id": "...",
      "title": "...",
      "description": "...",
      "category": "meditation",
      "difficulty": "beginner",
      "relevance_score": 0.95
    }
  ]
}
```

**Memory Search**
```json
{
  "total_found": 5,
  "results": [
    {
      "vector_id": "...",
      "content": "...",
      "similarity_score": 0.87
    }
  ]
}
```

**Drift Analysis**
```json
{
  "overall_drift_score": 0.65,
  "overall_status": "warning",
  "alert_level": "moderate",
  "recommendations": ["Take a break", "Practice breathing"]
}
```

---

## 🎯 Next Steps

1. **Update Components** - Replace raw axios calls with custom hooks
2. **Test API Requests** - Verify user_id is sent correctly
3. **Handle Errors** - Add error boundaries and user feedback
4. **Monitor Sessions** - Track user sessions in backend logs
5. **Add Logout** - Implement logout functionality in UI

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify localStorage has `mindset_user_id`
3. Check Network tab for `X-User-ID` header
4. Ensure SessionProvider wraps your App component

---

## 📚 Reference

See `SESSION_QUICK_START.tsx` for copy-paste examples of:
- Header component with user display
- Chat interface
- Assessment form
- Studio/recommendations
- Settings page
- Memory search
- Drift analysis

