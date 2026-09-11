/**
 * Session Management Utility
 * Handles user_id generation, storage, and retrieval from localStorage
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Session storage keys
 */
export const SESSION_KEYS = {
  USER_ID: 'mindset_user_id',
  SESSION_START: 'mindset_session_start',
  SESSION_LAST_ACTIVITY: 'mindset_session_last_activity',
  AUTH_TOKEN: 'authToken',
} as const;

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  // Session timeout in milliseconds (24 hours)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
  // Update activity timestamp every N milliseconds (5 minutes)
  ACTIVITY_UPDATE_INTERVAL: 5 * 60 * 1000,
} as const;

/**
 * Generate a new user ID (UUID v4)
 */
export const generateUserId = (): string => {
  return `user_${uuidv4()}`;
};

/**
 * Get or create a user ID
 * If no user ID exists in localStorage, generates a new one
 *
 * @returns User ID string
 */
export const getOrCreateUserId = (): string => {
  let userId = localStorage.getItem(SESSION_KEYS.USER_ID);

  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(SESSION_KEYS.USER_ID, userId);
    localStorage.setItem(SESSION_KEYS.SESSION_START, new Date().toISOString());
    console.log(`[Session] New user ID created: ${userId}`);
  }

  return userId;
};

/**
 * Get current user ID from localStorage
 *
 * @returns User ID or null if not set
 */
export const getUserId = (): string | null => {
  return localStorage.getItem(SESSION_KEYS.USER_ID);
};

/**
 * Clear user session
 * Removes all session data from localStorage
 */
export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEYS.USER_ID);
  localStorage.removeItem(SESSION_KEYS.SESSION_START);
  localStorage.removeItem(SESSION_KEYS.SESSION_LAST_ACTIVITY);
  console.log('[Session] Session cleared');
};

/**
 * Update last activity timestamp
 * Called periodically to track session activity
 */
export const updateSessionActivity = (): void => {
  localStorage.setItem(
    SESSION_KEYS.SESSION_LAST_ACTIVITY,
    new Date().toISOString()
  );
};

/**
 * Get session start time
 *
 * @returns ISO timestamp string or null
 */
export const getSessionStartTime = (): string | null => {
  return localStorage.getItem(SESSION_KEYS.SESSION_START);
};

/**
 * Get last activity time
 *
 * @returns ISO timestamp string or null
 */
export const getLastActivityTime = (): string | null => {
  return localStorage.getItem(SESSION_KEYS.SESSION_LAST_ACTIVITY);
};

/**
 * Check if session is still valid
 * Compares current time with session start time and timeout duration
 *
 * @returns true if session is valid, false if expired
 */
export const isSessionValid = (): boolean => {
  const sessionStart = getSessionStartTime();

  if (!sessionStart) {
    return false;
  }

  const sessionStartTime = new Date(sessionStart).getTime();
  const currentTime = new Date().getTime();
  const elapsed = currentTime - sessionStartTime;

  const isValid = elapsed < SESSION_CONFIG.SESSION_TIMEOUT;

  if (!isValid) {
    console.warn('[Session] Session expired');
    clearSession();
  }

  return isValid;
};

/**
 * Get session info object
 * Useful for debugging or logging
 *
 * @returns Session info object
 */
export const getSessionInfo = (): {
  userId: string | null;
  sessionStart: string | null;
  lastActivity: string | null;
  isValid: boolean;
  sessionDurationMs: number;
} => {
  const userId = getUserId();
  const sessionStart = getSessionStartTime();
  const lastActivity = getLastActivityTime();
  const isValid = isSessionValid();

  let sessionDurationMs = 0;
  if (sessionStart) {
    sessionDurationMs =
      new Date().getTime() - new Date(sessionStart).getTime();
  }

  return {
    userId,
    sessionStart,
    lastActivity,
    isValid,
    sessionDurationMs,
  };
};

/**
 * Initialize session
 * Should be called once when app starts
 * Sets up user ID and activity tracking
 */
export const initializeSession = (): string => {
  const userId = getOrCreateUserId();

  // Set initial activity
  updateSessionActivity();

  // Setup periodic activity updates
  const activityInterval = setInterval(() => {
    if (isSessionValid()) {
      updateSessionActivity();
    } else {
      clearInterval(activityInterval);
    }
  }, SESSION_CONFIG.ACTIVITY_UPDATE_INTERVAL);

  console.log(`[Session] Session initialized for user: ${userId}`);

  return userId;
};

/**
 * Format session duration for display
 *
 * @param durationMs Duration in milliseconds
 * @returns Formatted string (e.g., "2h 30m 15s")
 */
export const formatSessionDuration = (durationMs: number): string => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
};
