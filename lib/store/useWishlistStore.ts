'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistApi } from '@/lib/api/wishlist';
import { Product } from '@/lib/services/product';

interface WishlistStoreItem extends Product {
  addedAt: number;
}

interface WishlistState {
  _items: WishlistStoreItem[];
  isLoading: boolean;
  error: string | null;
  pendingToggles: Set<string>;
  addItem: (variantId: string, product: Product) => void;
  removeItem: (variantId: string) => void;
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (variantId: string, product: Product) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      _items: [],
      isLoading: false,
      error: null,
      pendingToggles: new Set(),

      addItem: (variantId, product) => {
        set(state => {
          if (state._items.some(i => (i.variantId || i.id) === variantId)) {
            return state;
          }

          return {
            _items: [
              ...state._items,
              {
                ...product,
                variantId,
                addedAt: Date.now(),
              },
            ],
          };
        });
      },

      removeItem: (variantId) => {
        set(state => ({
          _items: state._items.filter(
            i => (i.variantId || i.id) !== variantId
          ),
        }));
      },

      fetchWishlist: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await wishlistApi.get();
          const variantIds = response.data?.data?.variantIds || [];
          const items = variantIds.map((item: any) => buildFromVariantData(item));

          set({
            _items: items,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error:
              error?.response?.data?.message ||
              "Failed to fetch wishlist",
            isLoading: false,
          });
        }
      },
      toggleWishlist: async (variantIdRaw, product) => {
        const variantId = typeof variantIdRaw === 'object' && variantIdRaw !== null
          ? String((variantIdRaw as any)._id || (variantIdRaw as any).id || '')
          : String(variantIdRaw || '');

        const { pendingToggles } = get();

        if (pendingToggles.has(variantId)) {
          return;
        }

        const newPending = new Set(pendingToggles);
        newPending.add(variantId);

        const wasInList = get()._items.some(
          i => (i.variantId || i.id) === variantId
        );

        /**
         * Optimistic update
         */
        set(state => ({
          _items: wasInList
            ? state._items.filter(
                i => (i.variantId || i.id) !== variantId
              )
            : [
                ...state._items,
                {
                  ...product,
                  variantId,
                  addedAt: Date.now(),
                },
              ],
          pendingToggles: newPending,
        }));

        try {
          await wishlistApi.toggle(variantId);
        } catch (error) {
          console.log('Toggle wishlist failed:', error);

          /**
           * Rollback
           */
          set(state => ({
            _items: wasInList
              ? [
                  ...state._items,
                  {
                    ...product,
                    variantId,
                    addedAt: Date.now(),
                  },
                ]
              : state._items.filter(
                  i => (i.variantId || i.id) !== variantId
                ),
          }));
        } finally {
          set(state => {
            const next = new Set(state.pendingToggles);

            next.delete(variantId);

            return {
              pendingToggles: next,
            };
          });
        }
      },
    }),
    {
      name: 'pahadi-wishlist-storage',

      partialize: (state) => ({
        _items: state._items,
      }),
    }
  )
);

function buildFromVariantData(
  data: any,
  addedAt?: number
): WishlistStoreItem {
  const vid = data?._id || '';

  const price = data?.price ?? 0;
  const mrp = data?.mrp ?? price;

  const discount =
    mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  const coverImage =
    data?.coverImage?.url ||
    data?.imagesArray?.[0]?.url ||
    '';

  const brandName =
    typeof data?.brandId === 'object'
      ? data?.brandId?.name
      : data?.brand || 'Generic';

  const categoryName =
    typeof data?.categoryId === 'object'
      ? data?.categoryId?.name
      : data?.categoryName || 'General';

  const productData = data?.productId || {};

  return {
    id: vid,
    variantId: vid,

    title:
      data?.title ||
      productData?.title ||
      'Product',

    desc:
      data?.desc ||
      productData?.desc ||
      '',

    brand: brandName,

    categoryName,

    image:
      coverImage ||
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=800',

    price,
    mrp,
    discount,

    rating:
      data?.rating ??
      productData?.rating ??
      0,

    reviews:
      data?.reviews ??
      productData?.reviews ??
      0,

    isNew:
      data?.isNew ??
      productData?.isNew ??
      false,

    slug:
      data?.slug ||
      productData?.slug ||
      productData?.default_slug ||
      vid,

    categoryId:
      typeof data?.categoryId === 'object'
        ? data?.categoryId?._id
        : data?.categoryId ||
          productData?.categoryId,

    isPublished:
      data?.isPublished ??
      productData?.isPublished ??
      true,

    createdAt:
      data?.createdAt ||
      productData?.createdAt ||
      '',

    updatedAt:
      data?.updatedAt ||
      productData?.updatedAt ||
      '',

    attributes: data?.attributes || {},

    addedAt: addedAt ?? Date.now(),
  };
}