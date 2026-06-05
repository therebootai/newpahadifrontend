'use client';

import { create } from 'zustand';
import { shopApi } from '@/lib/fetchers';

interface OrderItem {
  variantId: string;
  snapshot: {
    productId: string;
    title: string;
    coverImage: string;
    sku: string;
    attributes?: Record<string, string>;
    slug?: string;
  };
  title?: string;
  coverImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  attributes?: Record<string, string>;
  slug?: string;
}

interface Order {
  _id: string;
  orderId: string;
  createdAt: string;
  orderStatus: 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  totalAmount: number;
  items: OrderItem[];
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  fetchOrders: (params?: { page?: number; limit?: number; status?: string }) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },

  fetchOrders: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await shopApi.get('/orders/me', { 
        params: { limit: 10, ...params } 
      });
      set({ 
        orders: response.data.data.orders, 
        pagination: response.data.data.pagination,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch orders', 
        isLoading: false 
      });
    }
  },

  getOrderById: async (id: string) => {
    try {
      const response = await shopApi.get(`/orders/me/${id}`);
      return response.data.data.order;
    } catch (error) {
      console.error("Failed to fetch order", error);
      return null;
    }
  }
}));
