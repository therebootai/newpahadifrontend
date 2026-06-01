'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Customer {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  role: 'admin' | 'staff' | 'customer';
}

interface CustomerState {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setCustomerAuth: (customer: Customer, token: string) => void;
  updateCustomer: (customer: Partial<Customer>) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  sendMobileChangeOTP: (newPhone: string) => Promise<void>;
  verifyMobileChange: (newPhone: string, otp: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customer: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setCustomerAuth: (customer, token) => 
        set({ customer, token, isAuthenticated: true, error: null }),
      
      updateCustomer: (customer) => 
        set((state) => ({ 
          customer: state.customer ? { ...state.customer, ...customer } : null 
        })),

      logout: () => 
        set({ customer: null, token: null, isAuthenticated: false, error: null }),

      fetchMe: async () => {
        if (!get().token) return;
        const { shopApi } = await import('@/lib/fetchers');
        set({ isLoading: true, error: null });
        try {
          const response = await shopApi.get('/users/me');
          set({ customer: response.data.data, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch profile', 
            isLoading: false 
          });
        }
      },

      updateProfile: async (data) => {
        const { shopApi } = await import('@/lib/fetchers');
        set({ isLoading: true, error: null });
        try {
          const response = await shopApi.patch('/users/me', data);
          set({ customer: response.data.data, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to update profile';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      sendMobileChangeOTP: async (newPhone) => {
        const { shopApi } = await import('@/lib/fetchers');
        set({ isLoading: true, error: null });
        try {
          await shopApi.post('/auth/mobile-change/send-otp', { newPhone });
          set({ isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to send OTP';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      verifyMobileChange: async (newPhone, otp) => {
        const { shopApi } = await import('@/lib/fetchers');
        set({ isLoading: true, error: null });
        try {
          const response = await shopApi.post('/auth/mobile-change/verify', { newPhone, otp });
          set({ customer: response.data.data, isLoading: false });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to verify OTP';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },
    }),
    {
      name: 'pahadi-customer-storage',
      partialize: (state) => ({ 
        customer: state.customer, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

