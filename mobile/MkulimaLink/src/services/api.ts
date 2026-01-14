import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private api: AxiosInstance;
  private baseURL = 'http://localhost:5000/api'; // Change for production

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private async setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage and redirect to login
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          // TODO: Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get(url, config);
    return response.data;
  }

  // Generic POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  // Generic PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  // Generic DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete(url, config);
    return response.data;
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Product API methods
export const productApi = {
  getAll: (params?: any) => apiService.get('/products', { params }),
  getById: (id: string) => apiService.get(`/products/${id}`),
  create: (data: any) => apiService.post('/products', data),
  update: (id: string, data: any) => apiService.put(`/products/${id}`, data),
  delete: (id: string) => apiService.delete(`/products/${id}`),
  search: (query: string, params?: any) =>
    apiService.get('/products/search', { params: { q: query, ...params } }),
};

// Transaction API methods
export const transactionApi = {
  getAll: (params?: any) => apiService.get('/transactions', { params }),
  getById: (id: string) => apiService.get(`/transactions/${id}`),
  create: (data: any) => apiService.post('/transactions', data),
  updateStatus: (id: string, status: string) =>
    apiService.put(`/transactions/${id}/status`, { status }),
};

// Market API methods
export const marketApi = {
  getPrices: (params?: any) => apiService.get('/market/prices', { params }),
  getTrends: (commodity: string, params?: any) =>
    apiService.get(`/market/trends/${commodity}`, { params }),
};

// Weather API methods
export const weatherApi = {
  getCurrent: (location?: any) => apiService.get('/weather/current', { params: location }),
  getForecast: (location?: any) => apiService.get('/weather/forecast', { params: location }),
};

// User API methods
export const userApi = {
  getProfile: () => apiService.get('/users/profile'),
  updateProfile: (data: any) => apiService.put('/users/profile', data),
  getStats: () => apiService.get('/users/stats'),
};

// Chat API methods
export const chatApi = {
  getChats: () => apiService.get('/chats'),
  getMessages: (chatId: string, params?: any) =>
    apiService.get(`/chats/${chatId}/messages`, { params }),
  sendMessage: (chatId: string, message: any) =>
    apiService.post(`/chats/${chatId}/messages`, message),
  createChat: (participantId: string) =>
    apiService.post('/chats', { participant: participantId }),
};

// Upload API methods
export const uploadApi = {
  uploadImage: (file: any, type: string = 'product') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return apiService.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default apiService;
