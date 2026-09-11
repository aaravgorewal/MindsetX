/**
 * Quick Start - Session Handling Integration Examples
 * Copy-paste these patterns into your components
 */

// ============================================================================
// STEP 1: Wrap your app with SessionProvider
// ============================================================================
// File: index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SessionProvider } from './context/SessionContext';
import './main.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </React.StrictMode>
);

// ============================================================================
// STEP 2: Display User ID in Header Component
// ============================================================================
// File: components/Header.tsx

import React from 'react';
import { useUserId } from '../context/SessionContext';

export const Header: React.FC = () => {
  const userId = useUserId();

  return (
    <header className="header">
      <h1>MindSet X</h1>
      {userId && (
        <div className="user-info">
          <p>User: {userId.slice(0, 12)}...</p>
        </div>
      )}
    </header>
  );
};

// ============================================================================
// STEP 3: Simple Chat with Auto User ID
// ============================================================================
// File: components/ChatInterface.tsx

import React, { useState } from 'react';
import { useChatApi } from '../hooks/useApi';

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, data, loading, error } = useChatApi();

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      // User ID is AUTOMATICALLY included by useChatApi hook
      const response = await sendMessage(message);
      console.log('Response:', response);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="chat-interface">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {error && <p className="error">{error.message}</p>}
      {data && <p className="response">{data.reply}</p>}
    </div>
  );
};

// ============================================================================
// STEP 4: Assessment Form with Auto User ID
// ============================================================================
// File: components/PHQ9Form.tsx

import React, { useState } from 'react';
import { useAssessmentApi } from '../hooks/useApi';

export const PHQ9Form: React.FC = () => {
  const [scores, setScores] = useState<number[]>(Array(9).fill(0));
  const { submitPhq9, data, loading, error } = useAssessmentApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // User ID is AUTOMATICALLY included by useAssessmentApi hook
      const response = await submitPhq9(scores);
      console.log('Assessment submitted:', response);
    } catch (err) {
      console.error('Failed to submit assessment:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="phq9-form">
      {scores.map((score, i) => (
        <div key={i} className="question">
          <label>Question {i + 1}</label>
          <select
            value={score}
            onChange={(e) => {
              const newScores = [...scores];
              newScores[i] = parseInt(e.target.value);
              setScores(newScores);
            }}
          >
            <option value="0">Not at all</option>
            <option value="1">Several days</option>
            <option value="2">More than half</option>
            <option value="3">Nearly every day</option>
          </select>
        </div>
      ))}
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Assessment'}
      </button>
      {data && (
        <div className="result">
          <p>Score: {data.totalScore}</p>
          <p>Severity: {data.severity}</p>
        </div>
      )}
    </form>
  );
};

// ============================================================================
// STEP 5: Studio Feed with Mood Selection
// ============================================================================
// File: components/Studio.tsx

import React, { useState } from 'react';
import { useStudioApi } from '../hooks/useApi';

export const Studio: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState('anxious');
  const {
    data,
    loading,
    error,
    getPersonalizedFeed,
    getCategories,
  } = useStudioApi();

  const handleGetRecommendations = async () => {
    try {
      // User ID is AUTOMATICALLY included by useStudioApi hook
      await getPersonalizedFeed(
        selectedMood,
        undefined,
        undefined,
        'beginner',
        10
      );
    } catch (err) {
      console.error('Failed to get recommendations:', err);
    }
  };

  return (
    <div className="studio">
      <h2>Wellness Studio</h2>

      <div className="mood-selector">
        <label>How are you feeling?</label>
        <select
          value={selectedMood}
          onChange={(e) => setSelectedMood(e.target.value)}
        >
          <option value="anxious">Anxious</option>
          <option value="depressed">Depressed</option>
          <option value="stressed">Stressed</option>
          <option value="overwhelmed">Overwhelmed</option>
          <option value="lonely">Lonely</option>
        </select>
      </div>

      <button onClick={handleGetRecommendations} disabled={loading}>
        {loading ? 'Loading...' : 'Get Recommendations'}
      </button>

      {error && <p className="error">{error.message}</p>}

      {data && (
        <div className="content-grid">
          {data.content.map((item: any) => (
            <div key={item.vector_id} className="content-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="metadata">
                <span className="category">{item.category}</span>
                <span className="difficulty">{item.difficulty}</span>
                <span className="score">
                  {(item.relevance_score * 100).toFixed(0)}% match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STEP 6: Session Info Display (Settings)
// ============================================================================
// File: components/SettingsScreen.tsx

import React from 'react';
import { useSession } from '../context/SessionContext';
import { formatSessionDuration } from '../services/sessionService';

export const SettingsScreen: React.FC = () => {
  const {
    userId,
    isSessionValid,
    sessionStartTime,
    sessionDurationMs,
    logout,
  } = useSession();

  return (
    <div className="settings">
      <h2>Settings & Session Info</h2>

      <section className="session-info">
        <h3>Session Information</h3>
        <table>
          <tbody>
            <tr>
              <td>User ID:</td>
              <td className="user-id">{userId}</td>
            </tr>
            <tr>
              <td>Status:</td>
              <td className={isSessionValid ? 'valid' : 'invalid'}>
                {isSessionValid ? '✅ Active' : '❌ Expired'}
              </td>
            </tr>
            <tr>
              <td>Started:</td>
              <td>
                {sessionStartTime
                  ? new Date(sessionStartTime).toLocaleString()
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td>Duration:</td>
              <td>{formatSessionDuration(sessionDurationMs)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

// ============================================================================
// STEP 7: Memory Query with Custom Hook
// ============================================================================
// File: components/MemorySearch.tsx

import React, { useState } from 'react';
import { useMemoryApi } from '../hooks/useApi';

export const MemorySearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'chat' | 'assessment' | 'hybrid'>('hybrid');
  const { data, loading, error, queryMemory } = useMemoryApi();

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      // User ID is AUTOMATICALLY included by useMemoryApi hook
      await queryMemory(query, searchType, 5, 0.4);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="memory-search">
      <h2>Search Past Sessions</h2>

      <div className="search-controls">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for similar sessions..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />

        <select value={searchType} onChange={(e) => setSearchType(e.target.value as any)}>
          <option value="chat">Chat Messages</option>
          <option value="assessment">Assessments</option>
          <option value="hybrid">Both</option>
        </select>

        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="error">{error.message}</p>}

      {data && (
        <div className="results">
          <p>{data.total_found} results found</p>
          {data.results.map((result: any) => (
            <div key={result.vector_id} className="result-item">
              <p>{result.content}</p>
              <small>Similarity: {(result.similarity_score * 100).toFixed(0)}%</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STEP 8: Drift Detection
// ============================================================================
// File: components/DriftAnalysis.tsx

import React from 'react';
import { useDriftApi } from '../hooks/useApi';

export const DriftAnalysis: React.FC = () => {
  const { data, loading, error, analyzeDrift } = useDriftApi();

  const handleAnalyze = async () => {
    try {
      // User ID is AUTOMATICALLY included by useDriftApi hook
      await analyzeDrift(true, true);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className="drift-analysis">
      <h2>Mental Health Drift Analysis</h2>

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Run Analysis'}
      </button>

      {error && <p className="error">{error.message}</p>}

      {data && (
        <div className="analysis-result">
          <h3>Results</h3>
          <p>Overall Drift Score: {data.overall_drift_score}</p>
          <p>Status: {data.overall_status}</p>
          <p>Alert Level: {data.alert_level}</p>
          {data.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {data.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// REFERENCE: All Available Hooks
// ============================================================================

/**
 * import { useSession } from '../context/SessionContext';
 * import { useUserId, useIsSessionValid, useSessionDuration } from '../context/SessionContext';
 *
 * import {
 *   useApi,
 *   useChatApi,
 *   useAssessmentApi,
 *   useMemoryApi,
 *   useStudioApi,
 *   useDriftApi
 * } from '../hooks/useApi';
 *
 * import { getOrCreateUserId, getSessionInfo } from '../services/sessionService';
 */

// ============================================================================
// TESTING: Verify Session is Working
// ============================================================================

/**
 * Open browser console and run these tests:
 */

// Test 1: Check session info
// import { getSessionInfo } from './services/sessionService';
// console.log('Session Info:', getSessionInfo());

// Test 2: Check localStorage
// console.log('User ID in localStorage:', localStorage.getItem('mindset_user_id'));

// Test 3: Check API request headers (in Network tab)
// Use DevTools → Network → Send any request → Check headers
// Should see: X-User-ID: user_...

// ============================================================================
