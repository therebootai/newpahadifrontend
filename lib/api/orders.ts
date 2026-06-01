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
  variantId?: string;
  title: string;
  sku: string;
  coverImage: string;
  price?: number;
  subtotal?: number;
  effectiveSubtotal?: number;
  quantity: number;
  discountApportioned?: number;
  effectivePrice?: number;
  taxDetails?: OrderTaxDetail[];
  totalTax?: number;
  itemTotal: number;
  attributes?: Record<string, string>;
  itemStatus?: 'active' | 'return_requested' | 'returned' | 'replacement_requested' | 'replaced';
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
  trackingData?: {
    trackStatus: string;
    currentStatus: string;
    statusSteps: Array<{ status: string; date: string }>;
    eta?: string;
  };
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
  isConfirmed?: boolean;
  isPartiallyConfirmed?: boolean;
  shippingAddress?: ShippingAddress;
  shipments?: OrderShipment[];
  items: OrderItem[];
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

export interface UpdateStatusData {
  orderStatus: OrderStatusType;
  comment?: string;
}

export interface TrackResponse {
  shipments: OrderShipment[];
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

  dispatch: async (id: string): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(`/orders/${id}/dispatch`);
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

  returnApprove: async (id: string, data?: { adminComment?: string }): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(
      `/orders/${id}/return/approve`,
      data || {}
    );
    return response.data.data;
  },

  returnReject: async (id: string, data: { reason: string }): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(
      `/orders/${id}/return/reject`,
      data
    );
    return response.data.data;
  },

  returnReceived: async (id: string, data?: { adminComment?: string }): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(
      `/orders/${id}/return/received`,
      data || {}
    );
    return response.data.data;
  },

  returnRefund: async (id: string, data: { reason?: string }): Promise<Order> => {
    const response = await adminApi.patch<{ data: Order; message: string }>(
      `/orders/${id}/return/refund`,
      data
    );
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