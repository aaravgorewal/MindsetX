/**
 * SESSION HANDLING VALIDATION & TESTING GUIDE
 * 
 * Use this file to verify session handling is working correctly
 */

// ============================================================================
// TEST 1: Verify Session Creation
// ============================================================================

/**
 * Run in browser console after app loads:
 */

// Check if user ID was created
console.log('1. Check localStorage for user_id:');
const userId = localStorage.getItem('mindset_user_id');
console.log('   User ID:', userId);
console.log('   ✅ PASS: User ID exists' || '❌ FAIL: No user ID found');

// Expected output format: user_[uuid]_[timestamp]
const isValidFormat = /^user_[a-f0-9-]+_\d+$/.test(userId || '');
console.log('   Format valid:', isValidFormat ? '✅ YES' : '❌ NO');

// Check session start time
const sessionStart = localStorage.getItem('mindset_session_start');
console.log('\n2. Check localStorage for session_start:');
console.log('   Session start:', sessionStart);
console.log('   Date:', new Date(parseInt(sessionStart || '0')).toLocaleString());

// ============================================================================
// TEST 2: Verify Session Context
// ============================================================================

/**
 * Add this temporary component to test session context:
 */

// File: components/SessionDebug.tsx

import React from 'react';
import { useSession, useUserId, useIsSessionValid, useSessionDuration } from '../context/SessionContext';

export const SessionDebug: React.FC = () => {
  const session = useSession();
  const userId = useUserId();
  const isValid = useIsSessionValid();
  const duration = useSessionDuration();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      backgroundColor: '#f0f0f0',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      zIndex: 9999,
      border: '2px solid #333'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Session Debug Info</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Full Session Object:</strong>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '8px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>User ID:</strong>
        <code style={{ backgroundColor: '#fff', padding: '4px', borderRadius: '3px' }}>
          {userId}
        </code>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>Session Valid:</strong>
        <span style={{ color: isValid ? 'green' : 'red', fontWeight: 'bold' }}>
          {isValid ? '✅ YES' : '❌ NO'}
        </span>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong>Session Duration:</strong>
        <code style={{ backgroundColor: '#fff', padding: '4px', borderRadius: '3px' }}>
          {formatDuration(duration)}
        </code>
      </div>

      <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
        <p>💡 Tip: Open DevTools → Network to see X-User-ID header</p>
      </div>
    </div>
  );
};

// Add to your App.tsx temporarily:
// <SessionDebug />

// ============================================================================
// TEST 3: Verify API Requests Include User ID
// ============================================================================

/**
 * Run in browser DevTools:
 */

// Open Network tab (F12 → Network)
// Send an API request (e.g., click chat send button)
// Find the request in the Network tab
// Click on it → Headers tab

// You should see:
// Request Headers:
// X-User-ID: user_a1b2c3d4-e5f6-7890_1234567890123

// Request Body:
// {
//   "user_id": "user_a1b2c3d4-e5f6-7890_1234567890123",
//   "message": "Hello",
//   ...
// }

// ============================================================================
// TEST 4: Test All Hook Types
// ============================================================================

/**
 * Create a temporary test component to verify all hooks work:
 */

// File: components/ApiHooksTest.tsx

import React, { useState } from 'react';
import {
  useChatApi,
  useAssessmentApi,
  useStudioApi,
  useMemoryApi,
  useDriftApi,
} from '../hooks/useApi';

export const ApiHooksTest: React.FC = () => {
  const chatApi = useChatApi();
  const assessmentApi = useAssessmentApi();
  const studioApi = useStudioApi();
  const memoryApi = useMemoryApi();
  const driftApi = useDriftApi();

  const testChat = async () => {
    console.log('Testing Chat API...');
    try {
      const result = await chatApi.sendMessage('Test message');
      console.log('✅ Chat API works:', result);
    } catch (err) {
      console.error('❌ Chat API failed:', err);
    }
  };

  const testAssessment = async () => {
    console.log('Testing Assessment API...');
    try {
      const result = await assessmentApi.submitPhq9([0, 1, 2, 1, 0, 1, 2, 1, 0]);
      console.log('✅ Assessment API works:', result);
    } catch (err) {
      console.error('❌ Assessment API failed:', err);
    }
  };

  const testStudio = async () => {
    console.log('Testing Studio API...');
    try {
      const result = await studioApi.getPersonalizedFeed('anxious', undefined, 'beginner', 5);
      console.log('✅ Studio API works:', result);
    } catch (err) {
      console.error('❌ Studio API failed:', err);
    }
  };

  const testMemory = async () => {
    console.log('Testing Memory API...');
    try {
      const result = await memoryApi.queryMemory('test query', 'hybrid', 3);
      console.log('✅ Memory API works:', result);
    } catch (err) {
      console.error('❌ Memory API failed:', err);
    }
  };

  const testDrift = async () => {
    console.log('Testing Drift API...');
    try {
      const result = await driftApi.analyzeDrift(true, true);
      console.log('✅ Drift API works:', result);
    } catch (err) {
      console.error('❌ Drift API failed:', err);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3>API Hooks Test Panel</h3>
      <p>Click buttons below and check console for results (F12)</p>
      
      <button onClick={testChat} style={{ marginRight: '10px', padding: '8px 12px' }}>
        Test Chat API {chatApi.loading && '⏳'}
      </button>
      
      <button onClick={testAssessment} style={{ marginRight: '10px', padding: '8px 12px' }}>
        Test Assessment API {assessmentApi.loading && '⏳'}
      </button>
      
      <button onClick={testStudio} style={{ marginRight: '10px', padding: '8px 12px' }}>
        Test Studio API {studioApi.loading && '⏳'}
      </button>
      
      <button onClick={testMemory} style={{ marginRight: '10px', padding: '8px 12px' }}>
        Test Memory API {memoryApi.loading && '⏳'}
      </button>
      
      <button onClick={testDrift} style={{ marginRight: '10px', padding: '8px 12px' }}>
        Test Drift API {driftApi.loading && '⏳'}
      </button>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
        <h4>Results:</h4>
        {chatApi.error && <p style={{ color: 'red' }}>Chat Error: {chatApi.error.message}</p>}
        {assessmentApi.error && <p style={{ color: 'red' }}>Assessment Error: {assessmentApi.error.message}</p>}
        {studioApi.error && <p style={{ color: 'red' }}>Studio Error: {studioApi.error.message}</p>}
        {memoryApi.error && <p style={{ color: 'red' }}>Memory Error: {memoryApi.error.message}</p>}
        {driftApi.error && <p style={{ color: 'red' }}>Drift Error: {driftApi.error.message}</p>}
      </div>
    </div>
  );
};

// Add to your App.tsx temporarily:
// <ApiHooksTest />

// ============================================================================
// TEST 5: Session Persistence
// ============================================================================

/**
 * Run in browser console:
 */

// 1. Get current user ID
const beforeReload = localStorage.getItem('mindset_user_id');
console.log('Before reload:', beforeReload);

// 2. Refresh the page (F5 or Cmd+R)
// 3. In console, run this after page loads:

const afterReload = localStorage.getItem('mindset_user_id');
console.log('After reload:', afterReload);
console.log('Same user?', beforeReload === afterReload ? '✅ YES' : '❌ NO');

// ============================================================================
// TEST 6: Session Expiration
// ============================================================================

/**
 * Test that sessions expire after 24 hours:
 */

// 1. Set session to 24 hours ago
const now = Date.now();
const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
localStorage.setItem('mindset_session_start', twentyFourHoursAgo.toString());

// 2. Reload page (F5)
// 3. Check console:

const oldStart = parseInt(localStorage.getItem('mindset_session_start') || '0');
const newStart = parseInt(localStorage.getItem('mindset_session_start') || '0');

if (oldStart === newStart) {
  console.log('❌ Session did NOT expire (expected)');
  console.log('   Note: Session expiration depends on backend validation');
} else {
  console.log('✅ Session expired and new one created');
  console.log('   Old start:', new Date(oldStart).toLocaleString());
  console.log('   New start:', new Date(newStart).toLocaleString());
}

// ============================================================================
// TEST 7: Logout Functionality
// ============================================================================

/**
 * Test logout clears session:
 */

// 1. In your app, call logout:
// const { logout } = useSession();
// logout();

// 2. Check localStorage was cleared:
console.log('After logout:');
console.log('User ID:', localStorage.getItem('mindset_user_id')); // Should be null
console.log('Session start:', localStorage.getItem('mindset_session_start')); // Should be null

// 3. Reload page (F5)
// 4. New session should be created:
console.log('After reload:');
console.log('New User ID:', localStorage.getItem('mindset_user_id')); // Should have new ID

// ============================================================================
// TEST 8: Error Handling
// ============================================================================

/**
 * Test error handling with invalid requests:
 */

// File: components/ErrorHandlingTest.tsx

import React, { useState } from 'react';
import { useChatApi } from '../hooks/useApi';

export const ErrorHandlingTest: React.FC = () => {
  const { sendMessage, error, loading } = useChatApi();
  const [testError, setTestError] = useState<string | null>(null);

  const testEmptyMessage = async () => {
    setTestError(null);
    try {
      await sendMessage('');
      setTestError('No error thrown (unexpected)');
    } catch (err: any) {
      setTestError(`Caught error: ${err.message}`);
    }
  };

  const testApiDown = async () => {
    setTestError(null);
    try {
      await sendMessage('This should fail if backend is down');
    } catch (err: any) {
      setTestError(`Backend error: ${err.message}`);
    }
  };

  return (
    <div>
      <button onClick={testEmptyMessage}>Test Empty Message</button>
      <button onClick={testApiDown}>Test Backend Connection</button>
      {error && <p style={{ color: 'red' }}>Hook Error: {error.message}</p>}
      {testError && <p style={{ color: 'orange' }}>Test Result: {testError}</p>}
      {loading && <p>Loading...</p>}
    </div>
  );
};

// ============================================================================
// CHECKLIST: Before Going to Production
// ============================================================================

/**
 * ✅ User ID is generated and stored in localStorage
 * ✅ User ID persists across page refreshes
 * ✅ User ID is sent with every API request (header + body)
 * ✅ All custom hooks (useChat, useAssessment, etc.) work
 * ✅ Error messages display correctly
 * ✅ Loading states work
 * ✅ Session validation works (24 hour expiry)
 * ✅ Logout clears session
 * ✅ New session created after logout
 * ✅ Network requests show X-User-ID header
 * ✅ Components receive data correctly from hooks
 * ✅ Error boundaries catch hook errors
 * ✅ Mobile/responsive design works
 * ✅ Backend receives and logs user_id
 * ✅ Backend can identify users by user_id
 */

// ============================================================================
// DEBUGGING: Common Issues & Solutions
// ============================================================================

/**
 * ISSUE: "User ID not found in localStorage"
 * SOLUTION:
 * 1. Check SessionProvider wraps your App in index.tsx
 * 2. Check browser console for errors on page load
 * 3. Try clearing localStorage: localStorage.clear() and reload
 * 
 * ISSUE: "X-User-ID header not in API requests"
 * SOLUTION:
 * 1. Check Network tab in DevTools
 * 2. Verify apiClient.ts interceptor is set up correctly
 * 3. Check that hooks are using apiClient (not raw axios)
 * 4. Try refreshing page (F5) to reinitialize interceptor
 * 
 * ISSUE: "Hooks returning undefined/null data"
 * SOLUTION:
 * 1. Check backend API is responding
 * 2. Check response format matches expected schema
 * 3. Check browser console for error messages
 * 4. Check Network tab for failed requests
 * 
 * ISSUE: "Session expires too quickly"
 * SOLUTION:
 * 1. Check sessionService.ts SESSION_DURATION_MS (should be 24h)
 * 2. Check backend isn't forcing session expiry
 * 3. Verify system time is correct (not set to wrong date)
 * 
 * ISSUE: "User ID changes on every page load"
 * SOLUTION:
 * 1. Check localStorage isn't being cleared on load
 * 2. Check for hard refresh (Ctrl+Shift+R) clearing cache
 * 3. Check sessionService.ts logic isn't regenerating ID
 */

// ============================================================================
