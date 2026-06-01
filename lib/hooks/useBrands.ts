'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  status: 'active' | 'inactive';
  productCount?: number;
  createdAt: string;
}

export function useBrands(search: string = '', options: any = {}) {
  return useQuery<Brand[]>({
    queryKey: ['brands', { search }],
    queryFn: async () => {
      const response = await adminApi.get('/brands', {
        params: { search }
      });
      // Ensure each brand has an id and extract logo URL from logoUrl or logo object
      const brandsData = (response.data.data || []).map((brand: any) => ({
        ...brand,
        id: brand._id,
        logo: brand.logoUrl || (typeof brand.logo === 'object' ? brand.logo?.url : brand.logo)
      }));
      return brandsData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await adminApi.post('/brands', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await adminApi.patch(`/brands/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.delete(`/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}
