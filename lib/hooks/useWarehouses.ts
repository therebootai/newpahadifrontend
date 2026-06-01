'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';

export interface Warehouse {
  id: string;
  name: string;
  pickupLocation: string;
  email: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  pinCode: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export function useWarehouses(isActive: boolean | null = null) {
  return useQuery<Warehouse[]>({
    queryKey: ['warehouses', { isActive }],
    queryFn: async () => {
      const response = await adminApi.get('/warehouses', {
        params: isActive !== null ? { isActive } : {}
      });
      const warehousesData = (response.data.data || []).map((wh: any) => ({
        ...wh,
        id: wh._id
      }));
      return warehousesData;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Warehouse>) => {
      const response = await adminApi.post('/warehouses', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Warehouse> }) => {
      const response = await adminApi.patch(`/warehouses/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}

export function useSyncWarehouses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await adminApi.post('/warehouses/sync-with-shiprocket');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
}
