'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi, CartItemPayload } from '@/lib/api/cart';

// Handles variantId that may be a string, an object { _id: string }, or { $oid: string }
function extractVariantId(vid: any): string {
  if (!vid) return '';
  if (typeof vid === 'string') return vid;
  if (typeof vid === 'object') {
    return String(vid._id || vid.$oid || vid.id || '');
  }
  return String(vid);
}

export interface TaxSlab {
  name: string;
  slab: number;
}

export interface CartItem {
  variantId: string;
  quantity: number;
  title?: string;
  image?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  isActive?: boolean;
  effectiveTax?: TaxSlab[] | null;
  attributes?: Record<string, string>;
  slug?: string;
}

export interface AppliedCoupon {
  code: string;
  type: string;
  value: number;
  maxDiscount: number;
  minOrderValue: number;
  calculatedDiscount: number;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  isLoading: boolean;
  isDirty: boolean; // True if local changes are not yet synced to backend
  isOpen: boolean;
  lastSyncedAt: number | null;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  syncToBackend: () => Promise<void>;
  fetchCart: () => Promise<void>;
  mergeCart: (backendItems: CartItem[]) => void;
  fetchAndMerge: () => Promise<void>;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      isLoading: false,
      isDirty: false,
      isOpen: false,
      lastSyncedAt: null,

      setIsOpen: (isOpen) => set({ isOpen }),

      addItem: (item) => {
        const variantIdStr = extractVariantId(item.variantId as string | Record<string, unknown>);
        const normalized = { ...item, variantId: variantIdStr };

        if (item.stock !== undefined && item.stock <= 0) {
          return; // Handled by UI toast
        }

        const items = get().items;
        const existingItem = items.find(i => extractVariantId(i.variantId as string | Record<string, unknown>) === variantIdStr);
        
        let newItems;
        if (existingItem) {
          const newQuantity = existingItem.quantity + normalized.quantity;
          // Cap at stock if available
          const finalQuantity = item.stock ? Math.min(newQuantity, item.stock) : newQuantity;

          newItems = items.map(i =>
            extractVariantId(i.variantId as string | Record<string, unknown>) === variantIdStr
              ? { ...i, ...normalized, quantity: finalQuantity }
              : i
          );
        } else {
          newItems = [...items, normalized];
        }
        set({ items: newItems, isDirty: true, appliedCoupon: null });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter(i =>
            extractVariantId(i.variantId as string | Record<string, unknown>) !== variantId
          ),
          isDirty: true,
          appliedCoupon: null,
        });
      },

      updateQuantity: (variantId, quantity) => {
        const currentItems = get().items;
        const item = currentItems.find(i => extractVariantId(i.variantId) === variantId);
        
        let newItems;
        if (quantity <= 0) {
          newItems = currentItems.filter(i =>
            extractVariantId(i.variantId as string | Record<string, unknown>) !== variantId
          );
        } else {
          // Cap at stock
          const finalQuantity = item?.stock ? Math.min(quantity, item.stock) : quantity;
          
          newItems = currentItems.map(i =>
            extractVariantId(i.variantId as string | Record<string, unknown>) === variantId
              ? { ...i, quantity: finalQuantity }
              : i
          );
        }
        set({ items: newItems, isDirty: true, appliedCoupon: null });
      },

      clearCart: async () => {
        set({ items: [], isDirty: false, appliedCoupon: null });
        try {
          await cartApi.clear();
        } catch (error) {
          console.error('Failed to clear cart on backend', error);
        }
      },

      syncToBackend: async () => {
        const items = get().items.map(i => ({
          variantId: extractVariantId(i.variantId as string | Record<string, unknown>),
          quantity: i.quantity,
        }));
        try {
          await cartApi.sync(items);
          set({ lastSyncedAt: Date.now(), isDirty: false });
        } catch (error) {
          console.error('Failed to sync cart with backend', error);
        }
      },

      fetchCart: async () => {
        // If we have pending local changes, don't overwrite them with (potentially stale) DB data
        if (get().isDirty) return;

        set({ isLoading: true });
        try {
          const response = await cartApi.get();
          const rawItems = response.data.data?.items || [];
          const currentLocalItems = get().items;

          const backendItems: CartItem[] = rawItems
            .map((item: any) => {
              const vid = item.variantId;
              const vidObj = (vid && typeof vid === 'object' ? vid : {}) as any;
              const vidStr = extractVariantId(vid);
              
              // Find if we already have this item locally to preserve its tax/rich data
              const existingLocal = currentLocalItems.find(i => extractVariantId(i.variantId) === vidStr);

              return {
                variantId: vidStr,
                quantity: item.quantity ?? 1,
                title: vidObj.title || item.title || existingLocal?.title,
                image: vidObj.coverImage?.url || vidObj.image || item.image || existingLocal?.image,
                price: vidObj.price || item.price || existingLocal?.price,
                mrp: vidObj.mrp || item.mrp || vidObj.price || item.price || existingLocal?.mrp,
                stock: vidObj.stocks ?? vidObj.stock ?? item.stock ?? existingLocal?.stock,
                isActive: vidObj.isActive !== false && vidObj.productId?.isPublished !== false,
                effectiveTax: vidObj.effectiveTax || item.effectiveTax || existingLocal?.effectiveTax || null,
                attributes: vidObj.attributes || item.attributes || existingLocal?.attributes,
                slug: vidObj.slug || item.slug || existingLocal?.slug || vidObj.productId?.slug,
              };
            });
          set({ items: backendItems, isLoading: false, isDirty: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to fetch cart', error);
        }
      },

      // Union merge: combines items from both, takes max quantity for duplicates
      mergeCart: (backendItems) => {
        const localItems = get().items;
        const mergedMap = new Map<string, CartItem>();

        // Add all backend items first
        backendItems.forEach(item => {
          mergedMap.set(item.variantId, { ...item });
        });

        // Overlay local items — take max quantity
        localItems.forEach(item => {
          const vidStr = extractVariantId(item.variantId as string | Record<string, unknown>);
          const existing = mergedMap.get(vidStr);
          if (existing) {
            mergedMap.set(vidStr, {
              ...existing,
              quantity: Math.max(existing.quantity, item.quantity),
              // local item may have richer display data
              title: item.title || existing.title,
              image: item.image || existing.image,
              price: item.price || existing.price,
              stock: item.stock || existing.stock,
              isActive: item.isActive ?? existing.isActive,
              effectiveTax: item.effectiveTax || existing.effectiveTax,
              attributes: item.attributes || existing.attributes,
              slug: item.slug || existing.slug,
            });
          } else {
            mergedMap.set(vidStr, item);
          }
        });

        set({ items: Array.from(mergedMap.values()), isDirty: true });
      },

      fetchAndMerge: async () => {
        set({ isLoading: true });
        try {
          const response = await cartApi.get();
          const rawItems = response.data.data?.items || [];
          const backendItems: CartItem[] = rawItems
            .map((item: any) => {
              const vid = item.variantId;
              const vidObj = (vid && typeof vid === 'object' ? vid : {}) as any;
              return {
                variantId: extractVariantId(vid),
                quantity: item.quantity ?? 1,
                title: vidObj.title || item.title,
                image: vidObj.coverImage?.url || vidObj.image || item.image,
                price: vidObj.price || item.price,
                mrp: vidObj.mrp || item.mrp || vidObj.price || item.price,
                stock: vidObj.stocks ?? vidObj.stock ?? item.stock,
                isActive: vidObj.isActive !== false && vidObj.productId?.isPublished !== false,
                effectiveTax: vidObj.effectiveTax || item.effectiveTax || null,
                attributes: vidObj.attributes || item.attributes,
                slug: vidObj.slug || item.slug || vidObj.productId?.slug,
              };
            });
          get().mergeCart(backendItems);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to fetch and merge cart', error);
        }
      },

      setAppliedCoupon: (appliedCoupon) => set({ appliedCoupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
    }),
    {
      name: 'pahadi-cart-storage',
      partialize: (state) => ({
        items: state.items,
        lastSyncedAt: state.lastSyncedAt,
        isDirty: state.isDirty,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);