import { adminApi, shopApi } from '@/lib/fetchers';

// ============================================================================
// Types (Enriched response from backend)
// ============================================================================

export interface OrderTaxDetail {
  name: string;
  slab: number;
  amount: number;
}

export interface OrderItem {
  _id?: string;
  variantId: string;
  snapshot: {
    productId: string;
    title: string;
    coverImage: string;
    sku: string;
    attributes?: Record<string, string>;
    returnPolicyType?: 'REPLACE' | 'RETURN' | 'BOTH' | 'NONE';
    returnWindowDays?: number;
  };
  title?: string;
  coverImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  itemTotal: number;
  effectivePrice?: number;
  attributes?: Record<string, string>;
  slug?: string;
  itemStatus: string;
  refundStatus?: string;
  refundId?: string;
  refundAmount?: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface OrderShipment {
  warehouseId: string;
  provider?: string;
  trackingNumber?: string;
  labelUrl?: string;
  trackUrl?: string;
  currentStatus?: string;
  estimatedDelivery?: string;
  timeline?: Array<{
    activity: string;
    location: string;
    date: string;
    time: string;
  }>;
  trackingData?: any;
}

export interface Order {
  _id: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  subtotal?: number;
  couponDiscount?: number;
  itemTax?: number;
  shippingCost?: number;
  appliedCoupon?: string;
  orderStatus: string;
  orderStatusRaw?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paidAmount?: number;
  refundId?: string;
  isConfirmed?: boolean;
  isPartiallyConfirmed?: boolean;
  shippingAddress?: ShippingAddress;
  shipments?: OrderShipment[];
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    comment?: string;
  }>;
  items: OrderItem[];
}

export interface ReturnRequest {
  _id: string;
  orderId: string;
  itemId: string;
  userId: any;
  type: 'return' | 'replace';
  reason: string;
  customerComment?: string;
  pickupAddress: any;
  status: 'requested' | 'approved' | 'rejected' | 'pickup_scheduled' | 'item_received' | 'resolved';
  refundStatus: string;
  refundAmount?: number;
  createdAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type OrderStatusType =
  | 'pending_payment'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'payment_failed'
  | 'payment_expired';

export interface TrackResponse {
  shipments: OrderShipment[];
}

export interface UpdateStatusData {
  orderStatus: OrderStatusType;
  comment?: string;
}

// ============================================================================
// API Methods
// ============================================================================

export const orderApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    isConfirmed?: boolean;
  }): Promise<OrderListResponse> => {
    const response = await adminApi.get<{ data: OrderListResponse }>('/orders', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await adminApi.get<{ data: Order }>(`/orders/${id}`);
    return response.data.data;
  },

  confirm: async (id: string): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(`/orders/${id}/confirm`);
    return response.data.data;
  },

  confirmPartial: async (id: string, items: { itemId: string; quantity: number }[]): Promise<any> => {
    const response = await adminApi.post(`/orders/${id}/confirm-partial`, { items });
    return response.data;
  },

  dispatch: async (id: string, payload?: { weight?: number, length?: number, breadth?: number, height?: number }): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(`/orders/${id}/dispatch`, payload);
    return response.data.data;
  },

  updateStatus: async (id: string, data: UpdateStatusData): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(
      `/orders/${id}/status`,
      data
    );
    return response.data.data;
  },

  track: async (id: string): Promise<TrackResponse> => {
    const response = await adminApi.get<{ data: TrackResponse }>(`/orders/${id}/track`);
    return response.data.data;
  },

  getInvoice: async (id: string): Promise<{ invoiceUrl: string }> => {
    const response = await adminApi.get<{ data: { invoiceUrl: string } }>(`/shiprocket/orders/${id}/invoice`);
    return response.data.data;
  },

  cancelAdmin: async (id: string, reason: string): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(`/orders/${id}/cancel/admin`, {
      reason,
    });
    return response.data.data;
  },

  cancelOrderItemAdmin: async (id: string, itemId: string, reason: string): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(`/orders/${id}/cancel-item/${itemId}/admin`, {
      reason,
    });
    return response.data.data;
  },

  refund: async (id: string, data: { reason?: string }): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(`/orders/${id}/refund`, data);
    return response.data.data;
  },

  refundOrderItemAdmin: async (id: string, itemId: string, reason: string): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(`/orders/${id}/refund-item/${itemId}`, {
      reason,
    });
    return response.data.data;
  },
};

export const returnApi = {
  list: async (params?: { page?: number; limit?: number; status?: string }): Promise<any> => {
    const response = await adminApi.get('/returns', { params });
    return response.data.data;
  },
  
  getByItemId: async (itemId: string): Promise<ReturnRequest | null> => {
    const response = await adminApi.get('/returns', { params: { itemId } });
    const requests = response.data.data.requests || [];
    return requests.length > 0 ? requests[0] : null;
  },

  approve: async (id: string, data?: { adminComment?: string }): Promise<any> => {
    const response = await adminApi.patch(`/returns/${id}/approve`, data || {});
    return response.data.data;
  },

  reject: async (id: string, data: { reason: string }): Promise<any> => {
    const response = await adminApi.patch(`/returns/${id}/reject`, data);
    return response.data.data;
  },

  received: async (id: string, data?: { adminComment?: string }): Promise<any> => {
    const response = await adminApi.patch(`/returns/${id}/received`, data || {});
    return response.data.data;
  },

  resolve: async (id: string, data: { refundMethod: 'razorpay' | 'manual'; manualReference?: string; adminNotes?: string }): Promise<any> => {
    const response = await adminApi.patch(`/returns/${id}/resolve`, data);
    return response.data.data;
  },
};

export const shopOrderApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<OrderListResponse> => {
    const response = await shopApi.get<{ data: OrderListResponse }>('/orders/me', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await shopApi.get<{ data: { order: Order } }>(`/orders/me/${id}`);
    return response.data.data.order;
  },

  track: async (id: string): Promise<TrackResponse> => {
    const response = await shopApi.get<{ data: TrackResponse }>(`/orders/me/${id}/track`);
    return response.data.data;
  },

  cancel: async (id: string, reason: string): Promise<Order> => {
    const response = await shopApi.patch<{ data: Order; message: string }>(`/orders/me/${id}/cancel`, {
      reason,
    });
    return response.data.data;
  },

  cancelOrderItem: async (id: string, itemId: string, reason: string): Promise<Order> => {
    const response = await shopApi.patch<{ data: Order; message: string }>(`/orders/me/${id}/cancel-item/${itemId}`, {
      reason,
    });
    return response.data.data;
  },

  getInvoice: async (id: string): Promise<{ invoiceUrl: string }> => {
    const response = await shopApi.get<{ data: { invoiceUrl: string } }>(`/shiprocket/orders/${id}/invoice`);
    return response.data.data;
  },

  createReturnRequest: async (data: {
    orderId: string;
    itemId: string;
    type: 'return' | 'replace';
    reason: string;
    customerComment?: string;
    pickupAddress: {
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
    };
  }): Promise<any> => {
    const response = await shopApi.post<{ data: any; message: string }>('/returns', data);
    return response.data.data;
  },
};

// ============================================================================
// Display Helpers
// ============================================================================

export function formatOrderDate(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${day < 10 ? '0' + day : day} ${month}, ${year} | ${hour12}:${minutes} ${ampm}`;
  } catch {
    return 'N/A';
  }
}

export function formatCurrency(amount: number | undefined | null): string {
  const value = amount ?? 0;
  return '₹' + value.toLocaleString('en-IN');
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  payment_failed: 'Payment Failed',
  payment_expired: 'Payment Expired',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-orange-500',
  processing: 'text-[#4EA674]',
  shipped: 'text-[#6467F2]',
  delivered: 'text-brand-dark',
  cancelled: 'text-[#FF6B6B]',
  returned: 'text-[#FF6B6B]',
  payment_failed: 'text-[#FF6B6B]',
  payment_expired: 'text-[#FF6B6B]',
};
