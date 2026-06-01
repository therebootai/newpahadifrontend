'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, api } from '@/lib/fetchers';
import { Banner, VideoContent, PopupContent } from '@/lib/types';

// ==========================================
// PUBLIC HOOK
// ==========================================
export function useStorefrontData() {
  return useQuery({
    queryKey: ['storefront-data'],
    queryFn: async () => {
      const response = await api.get('/storefront');
      return response.data.data as {
        banners: Banner[];
        videos: VideoContent[];
        popup: PopupContent | null;
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================================
// ADMIN HOOKS: BANNERS
// ==========================================
export function useAdminBanners() {
  return useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const response = await adminApi.get('/storefront/banners');
      return response.data.data || [];
    },
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await adminApi.post('/storefront/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await adminApi.patch(`/storefront/banners/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.delete(`/storefront/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

// ==========================================
// ADMIN HOOKS: VIDEOS
// ==========================================
export function useAdminVideos() {
  return useQuery<VideoContent[]>({
    queryKey: ['admin-videos'],
    queryFn: async () => {
      const response = await adminApi.get('/storefront/videos');
      return response.data.data || [];
    },
  });
}

export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await adminApi.post('/storefront/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await adminApi.patch(`/storefront/videos/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.delete(`/storefront/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

// ==========================================
// ADMIN HOOKS: POPUPS
// ==========================================
export function useAdminPopups() {
  return useQuery<PopupContent[]>({
    queryKey: ['admin-popups'],
    queryFn: async () => {
      const response = await adminApi.get('/storefront/popups');
      return response.data.data || [];
    },
  });
}

export function useCreatePopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await adminApi.post('/storefront/popups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

export function useUpdatePopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await adminApi.patch(`/storefront/popups/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}

export function useDeletePopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.delete(`/storefront/popups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-popups'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-data'] });
    },
  });
}
