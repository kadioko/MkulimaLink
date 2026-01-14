import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'farmer' | 'buyer';
  location: {
    region: string;
    district: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  isPremium: boolean;
  rating: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'farmer' | 'buyer';
  location: {
    region: string;
    district: string;
  };
}

const API_BASE_URL = 'http://localhost:5000/api'; // Change for production

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (userData: RegisterData) => {
    try {
      set({ isLoading: true });
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');

      if (token && userString) {
        const user = JSON.parse(userString);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Load user error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: async (userData: Partial<User>) => {
    try {
      const { token } = get();
      const response = await axios.put(
        `${API_BASE_URL}/users/profile`,
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUser = response.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      set({ user: updatedUser });
    } catch (error) {
      throw error;
    }
  },
}));

// Initialize auth state on app start
useAuthStore.getState().loadUser();
