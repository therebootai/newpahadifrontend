'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';

export interface SendNotificationPayload {
  title: string;
  body: string;
  target: 'all' | 'cart' | 'wishlist';
  scheduledAt?: string;
}

export interface Notification {
  _id: string;
  title: string;
  body: string;
  target: 'all' | 'cart' | 'wishlist';
  scheduledAt?: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentCount: number;
  createdAt: string;
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendNotificationPayload) => {
      const response = await adminApi.post('/notifications/send', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useGetNotifications(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: async () => {
      const response = await adminApi.get(`/notifications?page=${page}&limit=${limit}`);
      return response.data.data;
    },
  });
}

export function useCancelNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.delete(`/notifications/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
