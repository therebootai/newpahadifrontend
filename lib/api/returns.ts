import { adminApi } from '@/lib/fetchers';

// ============================================================================
// Types
// ============================================================================

export interface ReturnImage {
  url: string;
  publicId: string;
}

export interface ReturnShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface ReturnReplacementShipment {
  provider?: string;
  trackingNumber?: string;
  shippingLabelUrl?: string;
}

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'pickup_initiated'
  | 'item_received'
  | 'resolved';

export type RefundStatus = 'pending' | 'processed' | 'failed' | 'not_applicable';
export type RefundMethod = 'razorpay' | 'manual';
export type ReturnType = 'return' | 'replace';

export interface ReturnReplace {
  _id: string;
  orderId: string;
  itemId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  type: ReturnType;
  reason: string;
  customerComment?: string;
  imagesArray: ReturnImage[];
  pickupAddress: ReturnShippingAddress;
  returnToWarehouseId?: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  refundMethod?: RefundMethod;
  refundAmount?: number;
  refundReferenceId?: string;
  adminNotes?: string;
  replacementShipment?: ReturnReplacementShipment;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnListResponse {
  requests: ReturnReplace[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// API Error Helper
// ============================================================================

export function getReturnApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as {
      response?: {
        data?: { message?: string; errors?: Array<{ message: string }> };
      };
    };
    const data = err.response?.data;
    if (data?.errors && data.errors.length > 0) {
      return data.errors.map((e) => e.message).join(', ');
    }
    return data?.message || 'An error occurred';
  }
  return 'An error occurred';
}

// ============================================================================
// API Methods
// ============================================================================

export const returnsApi = {
  /**
   * Get all return requests with optional status filter
   */
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: ReturnStatus;
  }): Promise<ReturnListResponse> => {
    const response = await adminApi.get<{ data: ReturnListResponse }>('/returns', { params });
    return response.data.data;
  },

  /**
   * Get a single return request by ID
   */
  getById: async (id: string): Promise<ReturnReplace> => {
    const response = await adminApi.get<{ data: ReturnReplace }>(`/returns/${id}`);
    return response.data.data;
  },

  /**
   * Approve return request and schedule pickup
   */
  approve: async (
    id: string,
    data?: { logisticsMethod?: string; adminNotes?: string }
  ): Promise<ReturnReplace> => {
    const response = await adminApi.patch<{ data: ReturnReplace; message: string }>(
      `/returns/${id}/approve`,
      data || {}
    );
    return response.data.data;
  },

  /**
   * Reject return request
   */
  reject: async (id: string, data?: { reason?: string }): Promise<ReturnReplace> => {
    const response = await adminApi.patch<{ data: ReturnReplace; message: string }>(
      `/returns/${id}/reject`,
      data || {}
    );
    return response.data.data;
  },

  /**
   * Mark item as received at warehouse
   */
  markReceived: async (id: string, data?: { adminNotes?: string }): Promise<ReturnReplace> => {
    const response = await adminApi.patch<{ data: ReturnReplace; message: string }>(
      `/returns/${id}/received`,
      data || {}
    );
    return response.data.data;
  },

  /**
   * Resolve return (trigger refund or replacement)
   */
  resolve: async (
    id: string,
    data?: { refundMethod?: RefundMethod; manualReference?: string }
  ): Promise<ReturnReplace> => {
    const response = await adminApi.patch<{ data: ReturnReplace; message: string }>(
      `/returns/${id}/resolve`,
      data || {}
    );
    return response.data.data;
  },
};

// ============================================================================
// Display Helpers
// ============================================================================

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  pickup_scheduled: 'Pickup Scheduled',
  pickup_initiated: 'Pickup Initiated',
  item_received: 'Item Received',
  resolved: 'Resolved',
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  requested: 'text-orange-500',
  approved: 'text-blue-500',
  rejected: 'text-red-500',
  pickup_scheduled: 'text-purple-500',
  pickup_initiated: 'text-purple-500',
  item_received: 'text-green-500',
  resolved: 'text-brand-dark',
};

export const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  return: 'Return',
  replace: 'Replacement',
};