'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: 'admin' | 'staff' | 'customer';
  isActive: boolean;
  createdAt: string;
  city?: string;
  state?: string;
  location?: string;
  totalOrders?: number;
  totalSpend?: number;
}

export function useUsers(page: number = 1, limit: number = 10, role: string | string[] = 'all', isActive: string = 'all', search: string = '') {
  return useQuery<{ users: User[]; total: number; totalPages: number }>({
    queryKey: ['users', { page, limit, role, isActive, search }],
    queryFn: async () => {
      const params: any = { page, limit, search };
      if (role !== 'all') {
        params.role = Array.isArray(role) ? role.join(',') : role;
      }
      if (isActive !== 'all') params.isActive = isActive === 'active';
      
      const response = await adminApi.get('/users', { params });
      const data = response.data.data;
      return {
        users: (data.users || []).map((u: any) => ({ ...u, id: u._id })),
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomers(options: {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  isActive?: string;
} = {}) {
  return useQuery<{ users: User[]; total: number; totalPages: number }>({
    queryKey: ['customers', options],
    queryFn: async () => {
      const params: any = { ...options };
      if (params.isActive === 'all') delete params.isActive;
      else if (params.isActive) params.isActive = params.isActive === 'active';

      const response = await adminApi.get('/users/customers', { params });
      const data = response.data.data;
      return {
        users: (data.customers || []).map((u: any) => ({ ...u, id: u._id })),
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const data = Object.fromEntries(formData.entries());
      const response = await adminApi.post('/users/staff', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const data = Object.fromEntries(formData.entries());
      const response = await adminApi.patch(`/users/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.patch(`/users/${id}/status`);
    },
    onMutate: async (id: string) => {
      // Cancel both queries
      await queryClient.cancelQueries({ queryKey: ['users'] });
      await queryClient.cancelQueries({ queryKey: ['customers'] });

      const previousUsers = queryClient.getQueryData(['users']);
      const previousCustomers = queryClient.getQueryData(['customers']);

      // Optimistic update for 'users'
      queryClient.setQueriesData({ queryKey: ['users'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map((user: any) =>
            user.id === id ? { ...user, isActive: !user.isActive } : user
          ),
        };
      });

      // Optimistic update for 'customers'
      queryClient.setQueriesData({ queryKey: ['customers'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          users: old.users.map((user: any) =>
            user.id === id ? { ...user, isActive: !user.isActive } : user
          ),
        };
      });

      return { previousUsers, previousCustomers };
    },
    onError: (err, id, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      if (context?.previousCustomers) {
        queryClient.setQueryData(['customers'], context.previousCustomers);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
