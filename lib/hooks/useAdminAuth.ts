'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { adminApi } from '@/lib/fetchers';

export function useLoginMutation() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const response = await adminApi.post('/auth/login-password', {
        ...credentials,
        deviceInfo: 'Web Browser',
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      const userWithId = {
        ...data.user,
        id: data.user._id,
      };
      setAuth(userWithId, data.accessToken);
      router.push('/admin/dashboard');
    },
  });
}

export function useLogoutMutation() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await adminApi.post('/auth/logout');
    },
    onSettled: () => {
      // Clear all queries from cache on logout
      queryClient.clear();
      logout();
      router.push('/admin/login');
    },
  });
}
