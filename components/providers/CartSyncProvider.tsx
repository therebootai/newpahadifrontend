'use client';

import { useCartSync } from '@/lib/hooks/useCartSync';

export default function CartSyncProvider() {
  useCartSync();
  return null;
}