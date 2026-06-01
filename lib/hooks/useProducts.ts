'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';
import { toast } from 'sonner';

export interface Product {
  id: string;
  title: string;
  desc: string;
  specs: { key: string; value: string }[];
  brandId: { _id: string; name: string };
  categoryId: { _id: string; name: string };
  pickupWareHouseId: string;
  returnPolicyType: string;
  returnWindowDays: number;
  coverImage?: { url: string; publicId: string };
  imagesArray?: { url: string; publicId: string }[];
  isTaxInclude: boolean;
  taxes: { name: string; slab: number }[];
  effectiveTax?: { name: string; slab: number }[];
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
}

export function useProducts(page: number = 1, limit: number = 10, search: string = '', filters: any = {}) {
  return useQuery<{ products: Product[]; total: number; pages: number }>({
    queryKey: ['products', { page, limit, search, ...filters }],
    queryFn: async () => {
      const params: any = { page, limit, search };
      if (filters.isPublished !== 'all') params.isPublished = filters.isPublished;
      if (filters.isActive !== 'all') params.isActive = filters.isActive;
      if (filters.brandId !== 'all') params.brandId = filters.brandId;
      if (filters.categoryId !== 'all') params.categoryId = filters.categoryId;
      if (filters.warehouseId !== 'all') params.warehouseId = filters.warehouseId;
      if (filters.sort) params.sort = filters.sort;

      const response = await adminApi.get('/products', { params });
      const data = response.data.data;
      const total = data.total || 0;
      const totalPages = Math.ceil(total / limit) || 1;
      return {
        products: (data.products || []).map((p: any) => ({ ...p, id: p._id })),
        total,
        pages: totalPages
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await adminApi.get(`/products/${id}`);
      const product = response.data.data;
      return { ...product, id: product._id } as Product;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await adminApi.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create product';
      toast.error(message);
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await adminApi.patch(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update product';
      toast.error(message);
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete product';
      toast.error(message);
    }
  });
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const formData = new FormData();
      formData.append('isActive', String(isActive));
      const response = await adminApi.patch(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Product ${data.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
    }
  });
}

export function usePublishProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.patch(`/products/${id}/publish`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to publish product';
      toast.error(message);
    }
  });
}
