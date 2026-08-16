'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import api from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authReady: boolean;

  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  bootstrapSession: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
      authReady: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (token) => {
        set({ accessToken: token });
        // Access token kept in memory via zustand; also mirrored briefly for axios interceptor bootstrap
        if (typeof window !== 'undefined') {
          if (token) sessionStorage.setItem('accessToken', token);
          else sessionStorage.removeItem('accessToken');
          localStorage.removeItem('accessToken');
        }
      },

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password, rememberMe });
          const { user, accessToken } = data.data;
          get().setAccessToken(accessToken);
          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.error?.message || 'Login failed. Please try again.',
          };
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          const { user, accessToken } = data.data;
          get().setAccessToken(accessToken);
          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.error?.message || 'Registration failed. Please try again.',
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // Silent fail - logout anyway
        }
        get().clearAuth();
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data, isAuthenticated: true });
        } catch {
          get().clearAuth();
        }
      },

      bootstrapSession: async () => {
        set({ isLoading: true });
        try {
          const existingToken =
            typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;

          if (existingToken) {
            get().setAccessToken(existingToken);
            await get().fetchMe();
            return;
          }

          // Restore session from httpOnly refresh cookie (direct call — avoid 401 redirect loop)
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          const newToken = data.data?.accessToken;
          if (newToken) {
            get().setAccessToken(newToken);
            await get().fetchMe();
            return;
          }

          // No valid session — clear stale persisted auth
          if (get().user || get().isAuthenticated) {
            get().clearAuth();
          }
        } catch {
          if (get().user || get().isAuthenticated) {
            get().clearAuth();
          }
        } finally {
          set({ authReady: true, isLoading: false });
        }
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          sessionStorage.removeItem('accessToken');
        }
        set({ user: null, accessToken: null, isAuthenticated: false, authReady: true });
      },
    }),
    {
      name: 'aimentra-auth',
      partialize: (state) => ({
        user: state.user,
        // Do not persist accessToken — refresh cookie handles session restore
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
