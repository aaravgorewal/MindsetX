<!-- 
SESSION HANDLING SYSTEM - QUICK NAVIGATION GUIDE
This file serves as a quick index to all session handling files
-->

# 🚀 Session Handling System - Quick Navigation

## 📍 START HERE

### For Your First Time (5 minutes)
1. **[README_SESSION_HANDLING.md](README_SESSION_HANDLING.md)** ← Read this first
   - What this system does
   - 3-step setup
   - Quick examples

### For Implementation (15 minutes)
2. **[SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx)** ← Copy-paste code
   - Chat interface example
   - Assessment form example
   - Settings screen example
   - All other component examples

### For Complete Integration (30 minutes)
3. **[SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md)** ← Full guide
   - Detailed hook documentation
   - Component patterns
   - Backend integration
   - Error handling

---

## 📚 Documentation Index

### Quick Reference
| File | What | Read When |
|------|------|-----------|
| [README_SESSION_HANDLING.md](README_SESSION_HANDLING.md) | Overview & quick start | First time |
| [SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx) | Copy-paste examples | Implementing code |
| [PACKAGE_CONTENTS.md](PACKAGE_CONTENTS.md) | What's included | Want overview |

### Complete Guides
| File | What | Read When |
|------|------|-----------|
| [SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md) | Complete integration guide | Need all details |
| [SESSION_ARCHITECTURE_DIAGRAMS.md](SESSION_ARCHITECTURE_DIAGRAMS.md) | System diagrams & flow | Want visual explanation |
| [SESSION_IMPLEMENTATION_COMPLETE.md](SESSION_IMPLEMENTATION_COMPLETE.md) | Full technical reference | Need everything |

### Testing & Debugging
| File | What | Read When |
|------|------|-----------|
| [SESSION_TESTING_GUIDE.tsx](SESSION_TESTING_GUIDE.tsx) | Test procedures & debug | Verifying it works |

---

## 🎯 Common Tasks

### "I want to get started right now"
1. Read: [README_SESSION_HANDLING.md](README_SESSION_HANDLING.md)
2. Copy files: `context/SessionContext.tsx`, `hooks/useApi.ts`, `services/*`
3. Wrap app: Add `<SessionProvider>` to `index.tsx`
4. Done!

### "I want to add session handling to my chat component"
1. Open: [SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx)
2. Find: "Chat Interface" section
3. Copy: The code example
4. Paste: Into your component
5. Done!

### "I want to understand the complete system"
1. Read: [SESSION_ARCHITECTURE_DIAGRAMS.md](SESSION_ARCHITECTURE_DIAGRAMS.md)
2. Read: [SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md)
3. Reference: [SESSION_IMPLEMENTATION_COMPLETE.md](SESSION_IMPLEMENTATION_COMPLETE.md)

### "I want to verify it's working"
1. Follow: [SESSION_TESTING_GUIDE.tsx](SESSION_TESTING_GUIDE.tsx)
2. Run tests in browser console
3. Check Network tab
4. Done!

### "Something's not working"
1. Check: Browser console for errors
2. Verify: localStorage has user_id
3. Check: Network tab has X-User-ID header
4. Read: Troubleshooting section in [SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md)

---

## 📁 Core Files (Implementation)

Located in your project:

```
context/
  └── SessionContext.tsx ............... React Context + Hooks

hooks/
  └── useApi.ts ...................... Custom API Hooks

services/
  ├── sessionService.ts ............... Session Utilities
  └── apiClient.ts ................... Axios Client
```

---

## 🎓 Learning Path

### Beginner (30 mins)
1. [README_SESSION_HANDLING.md](README_SESSION_HANDLING.md) - Understanding
2. [SESSION_QUICK_START.tsx](SESSION_QUICK_START.tsx) - Copy examples
3. Add to your components
4. Test with [SESSION_TESTING_GUIDE.tsx](SESSION_TESTING_GUIDE.tsx)

### Intermediate (1 hour)
1. [SESSION_INTEGRATION_GUIDE.md](SESSION_INTEGRATION_GUIDE.md) - Complete guide
2. [SESSION_ARCHITECTURE_DIAGRAMS.md](SESSION_ARCHITECTURE_DIAGRAMS.md) - Understand flow
3. Integrate all components
4. Test all features

### Advanced (2 hours)
1. [SESSION_IMPLEMENTATION_COMPLETE.md](SESSION_IMPLEMENTATION_COMPLETE.md) - All details
2. Review core files code
3. Customize as needed
4. Deploy to production

---

## 🔑 Key Files Quick Reference

### File: SessionContext.tsx
**What it does:** React Context for session management
**Key exports:** `useSession()`, `useUserId()`, `useIsSessionValid()`, `useSessionDuration()`
**When you need it:** In any component that needs session data

### File: useApi.ts
**What it does:** Custom hooks for API calls
**Key exports:** `useChatApi()`, `useAssessmentApi()`, `useStudioApi()`, `useMemoryApi()`, `useDriftApi()`
**When you need it:** When making API requests from components

### File: sessionService.ts
**What it does:** Session utilities and helpers
**Key functions:** `getOrCreateUserId()`, `getSessionInfo()`, `isSessionValid()`
**When you need it:** When working with session data directly

### File: apiClient.ts
**What it does:** Axios HTTP client with interceptors
**Key feature:** Auto-adds X-User-ID header to all requests
**When you need it:** Automatically used by custom hooks

---

## ⚡ 30-Second Setup

```tsx
// 1. In index.tsx
import { SessionProvider } from './context/SessionContext';
root.render(<SessionProvider><App /></SessionProvider>);

// 2. In your component
import { useChatApi } from '../hooks/useApi';
const { sendMessage } = useChatApi();

// 3. Done! User ID auto-attached to all requests
```

---

## 🛠️ All Available Hooks

```tsx
// Session
useSession() → Full session object
useUserId() → Just user ID string
useIsSessionValid() → Boolean
useSessionDuration() → Duration in ms

// API
useChatApi() → Chat messages
useAssessmentApi() → Assessments (PHQ-9, GAD-7)
useStudioApi() → Recommendations
useMemoryApi() → Search history
useDriftApi() → Mental health drift
```

---

## 📊 What Happens Behind the Scenes

```
Component sends request
    ↓
Custom hook gets user_id from context
    ↓
Adds user_id to request headers + body
    ↓
Axios sends HTTP request
    ↓
Backend receives with X-User-ID header
    ↓
Backend processes with user identification
    ↓
Response sent back
    ↓
Component gets data
```

---

## ✅ Pre-Deployment Checklist

- [ ] SessionProvider wraps App in index.tsx
- [ ] All raw axios calls replaced with custom hooks
- [ ] Tested all API endpoints
- [ ] X-User-ID header visible in DevTools Network tab
- [ ] User ID persists across page refreshes
- [ ] Error handling working correctly
- [ ] Mobile/responsive design tested
- [ ] Backend receiving and logging user_id

---

## 💡 Pro Tips

1. **Use custom hooks everywhere** - Don't use raw axios, always use the provided hooks
2. **Check Network tab** - Verify X-User-ID header is being sent
3. **Use browser console** - Test `localStorage.getItem('mindset_user_id')`
4. **Handle errors** - All hooks return error state, use it!
5. **Test components included** - Use SessionDebug component to test

---

## 🎉 You're All Set!

The complete session handling system is ready to integrate. 

**Next Step:** Open [README_SESSION_HANDLING.md](README_SESSION_HANDLING.md) now!

---

## 📞 Document Overview

| Document | Size | Read Time | Purpose |
|----------|------|-----------|---------|
| README_SESSION_HANDLING.md | Short | 5 min | Get started |
| SESSION_QUICK_START.tsx | Medium | 10 min | Code examples |
| SESSION_INTEGRATION_GUIDE.md | Long | 20 min | Complete guide |
| SESSION_TESTING_GUIDE.tsx | Medium | 15 min | Test & debug |
| SESSION_ARCHITECTURE_DIAGRAMS.md | Medium | 15 min | Visual reference |
| SESSION_IMPLEMENTATION_COMPLETE.md | Long | 30 min | Full reference |
| PACKAGE_CONTENTS.md | Short | 5 min | Package overview |

---

**Total Documentation:** ~6,000 lines of guides, examples, and references

**Core Code:** ~500 lines (SessionContext, useApi, services)

**Everything you need:** Included and ready to use ✓

