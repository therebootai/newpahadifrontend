import { shopApi } from '@/lib/fetchers';

export const wishlistApi = {
  /**
   * GET /wishlist — fetch wishlist from backend
   */
  get: () => shopApi.get('/wishlist'),

  /**
   * PATCH /wishlist/toggle/:variantId — add or remove a variant from wishlist
   */
  toggle: (variantId: string) =>
    shopApi.patch(`/wishlist/toggle/${variantId}`),
};