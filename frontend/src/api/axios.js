import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config/env';

// Ensure any component using raw axios with relative paths still hits the backend
axios.defaults.baseURL = API_URL;

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
    const token = useAuthStore.getState().token || localStorage.getItem('token');
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

function normalizeResponse(response) {
  // Unwrap standardized API responses: { success, data, message, meta }
  if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
    response.data = response.data.data;
  }
  return response;
}

// Apply normalization globally for components still importing raw axios
axios.interceptors.response.use(
  (response) => normalizeResponse(response),
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    if (duration > 5000) {
      console.warn(`Slow API response: ${response.config.url} took ${duration}ms`);
    }
    return normalizeResponse(response);
  },
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    const status = error.response?.status;
    const method = config.method?.toLowerCase();

    // Retryable network errors (not auth)
    if (
      status !== 401 &&
      retryableStatuses.includes(status) &&
      retryableMethods.includes(method) &&
      config.metadata.retryCount < MAX_RETRIES
    ) {
      config.metadata.retryCount += 1;
      const delay = RETRY_DELAY * Math.pow(2, config.metadata.retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    // 401 — attempt token refresh once
    if (status === 401 && !config._retried) {
      const storedToken = useAuthStore.getState().token || localStorage.getItem('token');

      // No token at all — go to login immediately
      if (!storedToken) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Already refreshing — queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          config._retried = true;
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        }).catch((err) => Promise.reject(err));
      }

      config._retried = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/refresh-token`,
          { token: storedToken }
        );
        const raw = refreshResponse.data;
        const payload = raw?.data || raw;
        const newToken = payload?.token;

        if (!newToken) throw new Error('No token in refresh response');

        useAuthStore.getState().setAuth(payload.user || useAuthStore.getState().user, newToken);
        localStorage.setItem('token', newToken);

        processQueue(null, newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
