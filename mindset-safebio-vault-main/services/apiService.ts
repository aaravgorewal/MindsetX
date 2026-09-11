import axios, { AxiosInstance, AxiosError } from 'axios';
import { getOrCreateUserId, updateSessionActivity, SESSION_KEYS } from './sessionService';

/**
 * Centralized API Service
 * Provides a reusable Axios instance configured with base URL and interceptors
 * Automatically includes user_id in all requests via session management
 */

// Get backend URL from environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Create Axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds user_id, authorization token, and other common headers to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get or create user ID
    const userId = getOrCreateUserId();
    
    // Add user_id to request headers
    config.headers['X-User-ID'] = userId;
    
    // Also add to request body for POST/PUT/PATCH if data exists
    if (config.data && typeof config.data === 'object') {
      config.data.student_id = userId;
    }
    
    // Add authorization token if available
    const token = localStorage.getItem(SESSION_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Update session activity
    updateSessionActivity();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors globally and transforms responses
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response for debugging (optional)
    if (response.config.method === 'post' || response.config.method === 'put') {
      console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      console.error('[API] Unauthorized access. Please log in.');
      localStorage.removeItem(SESSION_KEYS.AUTH_TOKEN);
    } else if (error.response?.status === 403) {
      console.error('[API] Access forbidden.');
    } else if (error.response?.status === 404) {
      console.error('[API] Resource not found.');
    } else if (error.response?.status === 500) {
      console.error('[API] Server error.');
    }
    
    return Promise.reject(error);
  }
);

// Export the configured API instance
export default apiClient;

/**
 * Helper functions for common HTTP methods
 */
export const apiService = {
  /**
   * GET request
   */
  get: <T = any>(url: string, config?: any) => apiClient.get<T>(url, config),

  /**
   * POST request
   */
  post: <T = any>(url: string, data?: any, config?: any) =>
    apiClient.post<T>(url, data, config),

  /**
   * PUT request
   */
  put: <T = any>(url: string, data?: any, config?: any) =>
    apiClient.put<T>(url, data, config),

  /**
   * PATCH request
   */
  patch: <T = any>(url: string, data?: any, config?: any) =>
    apiClient.patch<T>(url, data, config),

  /**
   * DELETE request
   */
  delete: <T = any>(url: string, config?: any) =>
    apiClient.delete<T>(url, config),
};
