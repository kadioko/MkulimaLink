import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const KEYCHAIN_SERVICE = 'mkulimalink_auth';

async function secureStore(token: string, user: object): Promise<void> {
  await Keychain.setGenericPassword('user', token, { service: KEYCHAIN_SERVICE });
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

async function secureLoad(): Promise<{ token: string | null; user: object | null }> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
    const token = credentials ? credentials.password : null;
    const userString = await AsyncStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

async function secureClear(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  await AsyncStorage.removeItem('user');
}

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

      const payload = response.data?.data || response.data;
      const { token, user } = payload;
      await secureStore(token, user);

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

      const payload = response.data?.data || response.data;
      const { token, user } = payload;
      await secureStore(token, user);

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
      await secureClear();

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
      const { token, user } = await secureLoad();

      if (token && user) {
        set({
          user: user as User,
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
        `${API_BASE_URL}/auth/profile`,
        userData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUser = response.data?.data?.user || response.data?.user || response.data;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser)); // non-sensitive profile data

      set({ user: updatedUser });
    } catch (error) {
      throw error;
    }
  },
}));

// Initialize auth state on app start
useAuthStore.getState().loadUser();
