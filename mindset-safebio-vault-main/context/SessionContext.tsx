/**
 * Session Context
 * Provides session state and utilities to React components
 * Manages user ID, session status, and activity tracking
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getOrCreateUserId,
  getUserId,
  initializeSession,
  clearSession,
  isSessionValid,
  getSessionInfo,
  updateSessionActivity,
  formatSessionDuration,
} from './sessionService';

/**
 * Session context value type
 */
export interface SessionContextType {
  // Current state
  userId: string | null;
  isSessionValid: boolean;
  sessionStartTime: string | null;
  lastActivityTime: string | null;
  sessionDurationMs: number;
  
  // Actions
  initSession: () => void;
  logout: () => void;
  updateActivity: () => void;
  
  // Utilities
  getFormattedDuration: () => string;
}

/**
 * Create session context
 */
const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * Session Provider component
 * Wrap your app with this provider to enable session management
 */
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<string | null>(null);
  const [sessionDurationMs, setSessionDurationMs] = useState(0);

  // Initialize session on mount
  useEffect(() => {
    try {
      const id = initializeSession();
      setUserId(id);
      
      const info = getSessionInfo();
      setSessionStartTime(info.sessionStart);
      setLastActivityTime(info.lastActivity);
      setIsValid(info.isValid);
      
      console.log('[SessionContext] Session initialized');
    } catch (error) {
      console.error('[SessionContext] Failed to initialize session:', error);
    }
  }, []);

  // Update session validity periodically
  useEffect(() => {
    const validityCheckInterval = setInterval(() => {
      const valid = isSessionValid();
      setIsValid(valid);
      
      if (valid) {
        const info = getSessionInfo();
        setSessionDurationMs(info.sessionDurationMs);
        setLastActivityTime(info.lastActivity);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(validityCheckInterval);
  }, []);

  // Initialize session
  const handleInitSession = useCallback(() => {
    const id = initializeSession();
    setUserId(id);
    setIsValid(true);
    const info = getSessionInfo();
    setSessionStartTime(info.sessionStart);
    setLastActivityTime(info.lastActivity);
    console.log('[SessionContext] Session re-initialized');
  }, []);

  // Logout - clear session
  const handleLogout = useCallback(() => {
    clearSession();
    setUserId(null);
    setIsValid(false);
    setSessionStartTime(null);
    setLastActivityTime(null);
    console.log('[SessionContext] User logged out');
  }, []);

  // Update activity
  const handleUpdateActivity = useCallback(() => {
    updateSessionActivity();
    const info = getSessionInfo();
    setLastActivityTime(info.lastActivity);
  }, []);

  // Get formatted duration
  const getFormattedDuration = useCallback((): string => {
    return formatSessionDuration(sessionDurationMs);
  }, [sessionDurationMs]);

  const value: SessionContextType = {
    userId,
    isSessionValid: isValid,
    sessionStartTime,
    lastActivityTime,
    sessionDurationMs,
    initSession: handleInitSession,
    logout: handleLogout,
    updateActivity: handleUpdateActivity,
    getFormattedDuration,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

/**
 * Hook to use session context
 * Must be used inside SessionProvider
 */
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error(
      'useSession must be used within a SessionProvider. ' +
      'Make sure to wrap your app with <SessionProvider> in index.tsx or App.tsx'
    );
  }
  
  return context;
};

/**
 * Hook to get only the user ID
 * Simplified version when you only need the user ID
 */
export const useUserId = (): string | null => {
  const { userId } = useSession();
  return userId;
};

/**
 * Hook to check if session is valid
 */
export const useIsSessionValid = (): boolean => {
  const { isSessionValid: isValid } = useSession();
  return isValid;
};

/**
 * Hook to get session duration
 */
export const useSessionDuration = (): string => {
  const { getFormattedDuration } = useSession();
  return getFormattedDuration();
};
