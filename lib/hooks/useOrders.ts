'use client';

import { useQuery } from '@tanstack/react-query';
import { orderApi, Order } from '@/lib/api/orders';

// ============================================================================
// Query Keys
// ============================================================================

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...orderKeys.lists(), { ...filters }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

export interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  isConfirmed?: boolean;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { page = 1, limit = 10, status, isConfirmed } = options;

  return useQuery({
    queryKey: orderKeys.list({ page, limit, status, isConfirmed }),
    queryFn: async () => {
      const response = await orderApi.list({ page, limit, status, isConfirmed });
      return response;
    },
    staleTime: 30 * 1000,
  });
}

export function useOrderById(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await orderApi.list({ limit: 1 });
      // For single order, we need a dedicated endpoint
      // For now, return first matching or null
      return response.orders.find(o => o._id === id) || null;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}