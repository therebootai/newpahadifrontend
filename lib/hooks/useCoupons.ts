import { useState, useCallback } from 'react';
import { couponApi, Coupon, CouponListResponse, getApiErrorMessage } from '@/lib/api/coupons';

export interface CouponFormData {
  code: string;
  type: 'percentage' | 'flat';
  value: string;
  minOrderValue: string;
  maxDiscount: string;
  expiresAt: string;
  userLimit: string;
}

export interface FormErrors {
  code?: string;
  type?: string;
  value?: string;
  minOrderValue?: string;
  maxDiscount?: string;
  expiresAt?: string;
  userLimit?: string;
}

const CODE_REGEX = /^[A-Z0-9_]+$/;

export function validateCouponForm(data: CouponFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.code.trim()) {
    errors.code = 'Coupon code is required';
  } else if (data.code.length < 2) {
    errors.code = 'Coupon code must be at least 2 characters';
  } else if (data.code.length > 20) {
    errors.code = 'Coupon code must be at most 20 characters';
  } else if (!CODE_REGEX.test(data.code)) {
    errors.code = 'Coupon code must contain only uppercase letters, numbers, and underscores';
  }

  if (!data.type) {
    errors.type = 'Coupon type is required';
  }

  const value = parseFloat(data.value);
  if (!data.value.trim()) {
    errors.value = 'Coupon value is required';
  } else if (isNaN(value) || value <= 0) {
    errors.value = 'Coupon value must be positive';
  } else if (data.type === 'percentage' && value > 100) {
    errors.value = 'Percentage value cannot exceed 100';
  }

  if (data.minOrderValue.trim()) {
    const minVal = parseFloat(data.minOrderValue);
    if (isNaN(minVal) || minVal < 0) {
      errors.minOrderValue = 'Minimum order value must be 0 or greater';
    }
  }

  if (data.maxDiscount.trim()) {
    const maxVal = parseFloat(data.maxDiscount);
    if (isNaN(maxVal) || maxVal < 0) {
      errors.maxDiscount = 'Maximum discount must be 0 or greater';
    }
  }

  if (!data.expiresAt.trim()) {
    errors.expiresAt = 'Expiration date is required';
  } else {
    const expiryDate = new Date(data.expiresAt);
    if (isNaN(expiryDate.getTime())) {
      errors.expiresAt = 'Invalid expiration date format';
    } else if (expiryDate <= new Date()) {
      errors.expiresAt = 'Expiration date must be in the future';
    }
  }

  if (data.userLimit.trim()) {
    const limit = parseInt(data.userLimit, 10);
    if (isNaN(limit) || limit < 0) {
      errors.userLimit = 'User limit must be 0 or greater';
    }
  }

  return errors;
}

export function validateUpdateForm(data: Partial<CouponFormData>): FormErrors {
  const errors: FormErrors = {};

  if (data.code !== undefined) {
    if (!data.code.trim()) {
      errors.code = 'Coupon code is required';
    } else if (data.code.length < 2) {
      errors.code = 'Coupon code must be at least 2 characters';
    } else if (data.code.length > 20) {
      errors.code = 'Coupon code must be at most 20 characters';
    } else if (!CODE_REGEX.test(data.code)) {
      errors.code = 'Coupon code must contain only uppercase letters, numbers, and underscores';
    }
  }

  if (data.value !== undefined && data.value.trim()) {
    const value = parseFloat(data.value);
    if (isNaN(value) || value <= 0) {
      errors.value = 'Coupon value must be positive';
    } else if (data.type === 'percentage' && value > 100) {
      errors.value = 'Percentage value cannot exceed 100';
    }
  }

  if (data.expiresAt !== undefined && data.expiresAt.trim()) {
    const expiryDate = new Date(data.expiresAt);
    if (isNaN(expiryDate.getTime())) {
      errors.expiresAt = 'Invalid expiration date format';
    }
  }

  return errors;
}

export interface UseCouponsOptions {
  page?: number;
  limit?: number;
}

export function useCoupons(options: UseCouponsOptions = {}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CouponListResponse['pagination'] | null>(null);

  const fetchCoupons = useCallback(async (params?: { page?: number; limit?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await couponApi.list({
        page: params?.page ?? options.page ?? 1,
        limit: params?.limit ?? options.limit ?? 10,
      });
      // Ensure coupons is always an array
      setCoupons(Array.isArray(response.data) ? response.data : []);
      setPagination(response.pagination ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err));
      // Reset coupons to empty array on error
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit]);

  const createCoupon = async (data: {
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
    expiresAt: string;
    userLimit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await couponApi.create(data);
      return response;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCoupon = async (id: string, data: Parameters<typeof couponApi.update>[1]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await couponApi.update(id, data);
      return response;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await couponApi.delete(id);
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleCoupon = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await couponApi.update(id, { isActive: undefined });
      return response;
    } catch (err) {
      setError(getApiErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    coupons,
    loading,
    error,
    pagination,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCoupon,
  };
}