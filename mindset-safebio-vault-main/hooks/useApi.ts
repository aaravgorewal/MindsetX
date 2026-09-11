/**
 * API Hook with Session Integration
 * Simplifies API calls with automatic user_id inclusion and error handling
 */

import { useState, useCallback } from 'react';
import apiClient from '../services/apiService';
import { useUserId } from '../context/SessionContext';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * API request state
 */
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: AxiosError | null;
}

/**
 * API response with user context
 */
export interface ApiResponseWithUser<T> {
  data: T;
  userId: string | null;
  timestamp: string;
}

/**
 * Hook for making API requests with session data
 *
 * @example
 * const { data, loading, error, request } = useApi<ChatResponse>();
 * 
 * // Make a POST request
 * await request('POST', '/chat', {
 *   message: 'Hello',
 *   session_id: 'xyz'
 * });
 */
export const useApi = <T = any>() => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const userId = useUserId();

  const request = useCallback(
    async (
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      url: string,
      data?: any
    ) => {
      setState({ data: null, loading: true, error: null });

      try {
        let response: AxiosResponse<T>;

        // Add student_id to request if not already present
        const requestData = data ? { ...data, student_id: userId } : undefined;

        switch (method) {
          case 'GET':
            response = await apiClient.get<T>(url);
            break;
          case 'POST':
            response = await apiClient.post<T>(url, requestData);
            break;
          case 'PUT':
            response = await apiClient.put<T>(url, requestData);
            break;
          case 'PATCH':
            response = await apiClient.patch<T>(url, requestData);
            break;
          case 'DELETE':
            response = await apiClient.delete<T>(url);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } catch (err) {
        const axiosError = err as AxiosError;
        setState({ data: null, loading: false, error: axiosError });
        console.error(`[useApi] ${method} ${url} failed:`, axiosError);
        throw axiosError;
      }
    },
    [userId]
  );

  return { ...state, request };
};

/**
 * Specialized hook for chat API calls
 */
export const useChatApi = () => {
  const { data, loading, error, request } = useApi<any>();
  const userId = useUserId();

  const sendMessage = useCallback(
    async (
      message: string,
      sessionId?: string,
      chatHistory?: Array<{ role: string; text: string }>
    ) => {
      return request('POST', '/chat', {
        message,
        session_id: sessionId,
        chat_history: chatHistory,
        student_id: userId,
      });
    },
    [request, userId]
  );

  return { data, loading, error, sendMessage };
};

/**
 * Specialized hook for assessment API calls
 */
export const useAssessmentApi = () => {
  const { data, loading, error, request } = useApi<any>();
  const userId = useUserId();

  const submitPhq9 = useCallback(
    async (scores: number[]) => {
      return request('POST', '/phq9', {
        scores,
        student_id: userId,
        timestamp: new Date().toISOString(),
      });
    },
    [request, userId]
  );

  return { data, loading, error, submitPhq9 };
};

/**
 * Specialized hook for memory query API calls
 */
export const useMemoryApi = () => {
  const { data, loading, error, request } = useApi<any>();
  const userId = useUserId();

  const queryMemory = useCallback(
    async (
      query: string,
      searchType: 'chat' | 'assessment' | 'hybrid' = 'hybrid',
      limit: number = 5,
      threshold: number = 0.4
    ) => {
      return request('POST', '/memory/query', {
        query,
        search_type: searchType,
        limit,
        score_threshold: threshold,
        student_id: userId,
      });
    },
    [request, userId]
  );

  return { data, loading, error, queryMemory };
};

/**
 * Specialized hook for studio feed API calls
 */
export const useStudioApi = () => {
  const { data, loading, error, request } = useApi<any>();
  const userId = useUserId();

  const getPersonalizedFeed = useCallback(
    async (
      mood?: string,
      query?: string,
      categories?: string[],
      difficulty?: string,
      limit: number = 10
    ) => {
      return request('POST', '/studio', {
        mood,
        query,
        categories,
        difficulty,
        limit,
        student_id: userId,
      });
    },
    [request, userId]
  );

  const getCategories = useCallback(async () => {
    return request('GET', '/studio/categories');
  }, [request]);

  const getCategoryFeed = useCallback(
    async (category: string, difficulty?: string, limit: number = 10) => {
      return request('POST', '/studio/category', {
        category,
        difficulty,
        limit,
      });
    },
    [request]
  );

  const getTrendingFeed = useCallback(
    async (limit: number = 10, days: number = 7) => {
      return request('POST', '/studio/trending', {
        limit,
        days,
      });
    },
    [request]
  );

  return {
    data,
    loading,
    error,
    getPersonalizedFeed,
    getCategories,
    getCategoryFeed,
    getTrendingFeed,
  };
};

/**
 * Specialized hook for drift detection API calls
 */
export const useDriftApi = () => {
  const { data, loading, error, request } = useApi<any>();
  const userId = useUserId();

  const analyzeDrift = useCallback(
    async (includeChat: boolean = true, includePhq9: boolean = true) => {
      return request('POST', '/drift', {
        student_id: userId,
        include_chat: includeChat,
        include_phq9: includePhq9,
        limit_history: 10,
      });
    },
    [request, userId]
  );

  return { data, loading, error, analyzeDrift };
};
