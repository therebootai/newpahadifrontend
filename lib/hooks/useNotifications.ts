'use client';

import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';

export interface SendNotificationPayload {
  title: string;
  body: string;
  target: 'all' | 'cart' | 'wishlist';
}

export function useSendNotification() {
  return useMutation({
    mutationFn: async (payload: SendNotificationPayload) => {
      const response = await adminApi.post('/notifications/send', payload);
      return response.data;
    },
  });
}
