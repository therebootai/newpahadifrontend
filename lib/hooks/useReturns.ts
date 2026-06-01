'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  returnsApi,
  ReturnReplace,
  ReturnStatus,
  RefundMethod,
  getReturnApiErrorMessage,
} from '@/lib/api/returns';

// ============================================================================
// Query Keys
// ============================================================================

export const returnKeys = {
  all: ['returns'] as const,
  lists: () => [...returnKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...returnKeys.lists(), { ...filters }] as const,
  details: () => [...returnKeys.all, 'detail'] as const,
  detail: (id: string) => [...returnKeys.details(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

export interface UseReturnsOptions {
  page?: number;
  limit?: number;
  status?: ReturnStatus;
}

export function useReturns(options: UseReturnsOptions = {}) {
  const { page = 1, limit = 10, status } = options;

  return useQuery({
    queryKey: returnKeys.list({ page, limit, status }),
    queryFn: async () => {
      const response = await returnsApi.list({ page, limit, status });
      return response;
    },
    staleTime: 30 * 1000,
  });
}

export function useReturnById(id: string) {
  return useQuery({
    queryKey: returnKeys.detail(id),
    queryFn: async () => {
      const response = await returnsApi.getById(id);
      return response;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useApproveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      logisticsMethod,
      adminNotes,
    }: {
      id: string;
      logisticsMethod?: string;
      adminNotes?: string;
    }) => {
      return await returnsApi.approve(id, { logisticsMethod, adminNotes });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(data._id) });
    },
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return await returnsApi.reject(id, { reason });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(data._id) });
    },
  });
}

export function useMarkReturnReceived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      return await returnsApi.markReceived(id, { adminNotes });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(data._id) });
    },
  });
}

export function useResolveReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      refundMethod,
      manualReference,
    }: {
      id: string;
      refundMethod?: RefundMethod;
      manualReference?: string;
    }) => {
      return await returnsApi.resolve(id, { refundMethod, manualReference });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: returnKeys.lists() });
      queryClient.invalidateQueries({ queryKey: returnKeys.detail(data._id) });
    },
  });
}

// ============================================================================
// Error Helper Re-export
// ============================================================================

export { getReturnApiErrorMessage };