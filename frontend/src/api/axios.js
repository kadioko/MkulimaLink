import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/env';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const retryableStatuses = [408, 429, 500, 502, 503, 504];
const retryableMethods = ['get', 'head', 'options', 'put'];

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: Date.now(), retryCount: config.metadata?.retryCount || 0 };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    if (duration > 5000) {
      console.warn(`Slow API response: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const status = error.response?.status;
    const method = config.method?.toLowerCase();

    if (
      retryableStatuses.includes(status) &&
      retryableMethods.includes(method) &&
      config.metadata.retryCount < MAX_RETRIES
    ) {
      config.metadata.retryCount += 1;
      const delay = RETRY_DELAY * Math.pow(2, config.metadata.retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Normalize API responses that may be in legacy shape or standardized shape.
 * Standard: { success: true, data, message, meta }
 * Legacy: raw array/object
 */
export const extractData = (response) => {
  if (!response || !response.data) return null;
  if (response.data && 'success' in response.data) {
    return response.data.data;
  }
  return response.data;
};

export const extractMeta = (response) => {
  if (!response || !response.data) return {};
  return response.data?.meta || {};
};

export default api;
