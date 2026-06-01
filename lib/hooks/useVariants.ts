'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';
import { toast } from 'sonner';

export interface Variant {
  id: string;
  productId: string;
  title: string;
  slug: string;
  sku: string;
  price: number;
  mrp: number;
  stocks: number;
  attributes: Record<string, string>;
  discount?: { type: 'percentage' | 'flat'; value: number };
  coverImage?: { url: string; publicId: string };
  imagesArray?: { url: string; publicId: string }[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export function useVariants(productId: string) {
  return useQuery({
    queryKey: ['variants', productId],
    queryFn: async () => {
      if (!productId) return [];
      const response = await adminApi.get(`/products/${productId}/variants`);
      return (response.data.data || []).map((v: any) => ({ ...v, id: v._id }));
    },
    enabled: !!productId,
  });
}

export function useCreateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await adminApi.post('/variants', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      const productId = variables.get('productId');
      queryClient.invalidateQueries({ queryKey: ['variants', productId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create variant';
      toast.error(message);
    }
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await adminApi.patch(`/variants/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variants', data.productId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update variant';
      toast.error(message);
    }
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      await adminApi.delete(`/variants/${id}`);
      return { productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variants', data.productId] });
      toast.success('Variant deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete variant';
      toast.error(message);
    }
  });
}

export function useToggleVariantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const response = await adminApi.patch(`/variants/${id}/toggle`);
      return { ...response.data.data, productId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variants', data.productId] });
      toast.success(`Variant ${data.isActive ? 'activated' : 'hidden'} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to toggle status';
      toast.error(message);
    }
  });
}
