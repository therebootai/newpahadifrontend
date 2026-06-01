export interface Product {
  id: string;
  title: string;
  desc?: string;
  brand: string;
  categoryName?: string;
  image: string;
  price: number;
  mrp: number;
  discount: number;
  rating: number;
  reviews: number;
  isNew?: boolean;
  slug: string;
  categoryId?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  variantId?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  name?: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  expiresAt: string;
  startsAt?: string;
  userLimit?: number;
  isActive?: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Available coupon type (from /coupons/available endpoint - public endpoint)
export interface AvailableCoupon {
  _id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  expiresAt: string;
}

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

export interface RazorpayWindow extends Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}

export interface Banner {
  _id: string;
  title: string;
  desktopImage: { url: string; publicId: string };
  mobileImage: { url: string; publicId: string };
  link?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface VideoContent {
  _id: string;
  title: string;
  video: { url: string; publicId: string };
  isActive: boolean;
  sortOrder: number;
}

export interface PopupContent {
  _id: string;
  title: string;
  image: { url: string; publicId: string };
  link?: string;
  isActive: boolean;
}
