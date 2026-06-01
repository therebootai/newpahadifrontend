import { shopApi } from '@/lib/fetchers';

export interface Coupon {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  expiresAt: string;
}

export interface ValidationResponse {
  valid: boolean;
  coupon: Coupon | null;
  calculatedDiscount: number;
  error?: string;
  message?: string;
}

export const shopCouponApi = {
  getAvailableCoupons: async (maxOrderValue: number): Promise<Coupon[]> => {
    const response = await shopApi.get<{ data: { coupons: Coupon[] } }>('/coupons/available', {
      params: { maxOrderValue },
    });
    return response.data.data.coupons;
  },

  validateCoupon: async (code: string, subtotal: number): Promise<ValidationResponse> => {
    const response = await shopApi.get<{ data: ValidationResponse }>('/coupons/validate', {
      params: { code, subtotal },
    });
    return response.data.data;
  },
};
