import { shopApi } from '@/lib/fetchers';

export interface CartItemPayload {
  variantId: string;
  quantity: number;
}

export const cartApi = {
  /**
   * GET /cart — fetch current cart from backend
   */
  get: () => shopApi.get('/cart'),

  /**
   * PUT /cart/sync — sync full items array to backend
   */
  sync: (items: CartItemPayload[]) =>
    shopApi.put('/cart/sync', { items }),

  /**
   * DELETE /cart — clear cart on backend
   */
  clear: () => shopApi.delete('/cart'),
};