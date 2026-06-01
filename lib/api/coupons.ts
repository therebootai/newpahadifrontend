import { adminApi } from '@/lib/fetchers';

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  expiresAt: string;
  startsAt: string;
  userLimit: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListResponse {
  data: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BackendCouponListResponse {
  coupons: Coupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Array<{ message: string; path?: string }>;
}

export const couponApi = {
  list: async (params?: { page?: number; limit?: number }): Promise<CouponListResponse> => {
    const response = await adminApi.get<{ data: BackendCouponListResponse }>('/coupons', { params });
    // Backend returns { coupons: [...], pagination: {...} }, map to frontend format
    return {
      data: response.data.data.coupons,
      pagination: response.data.data.pagination,
    };
  },

  getById: async (id: string): Promise<Coupon> => {
    const response = await adminApi.get<{ data: Coupon }>(`/coupons/${id}`);
    return response.data.data;
  },

  create: async (data: {
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
    expiresAt: string;
    userLimit?: number;
  }): Promise<Coupon> => {
    const response = await adminApi.post<{ data: Coupon; message: string }>('/coupons', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<{
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    minOrderValue: number;
    maxDiscount: number;
    expiresAt: string;
    userLimit: number;
    isActive: boolean;
  }>): Promise<Coupon> => {
    const response = await adminApi.patch<{ data: Coupon; message: string }>(`/coupons/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await adminApi.delete(`/coupons/${id}`);
  },

  toggle: async (id: string): Promise<Coupon> => {
    const response = await adminApi.patch<{ data: Coupon; message: string }>(`/coupons/${id}`, { isActive: undefined });
    return response.data.data;
  },
};

export function getCouponListErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { message?: string } } };
    return err.response?.data?.message || 'Failed to fetch coupons';
  }
  return 'Failed to fetch coupons';
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as { response?: { data?: { message?: string; errors?: Array<{ message: string }> } } };
    const data = err.response?.data;
    if (data?.errors && data.errors.length > 0) {
      return data.errors.map((e) => e.message).join(', ');
    }
    return data?.message || 'An error occurred';
  }
  return 'An error occurred';
}