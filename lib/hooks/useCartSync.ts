'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store/useCartStore';
import { useCustomerStore } from '@/lib/store/useCustomerStore';
import { cartApi } from '@/lib/api/cart';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ;
const DEBOUNCE_MS = 1500;

function buildPayload(items: { variantId: string; quantity: number }[]) {
  return { items };
}

function sendBeaconWithAuth(url: string, body: { items: { variantId: string; quantity: number }[] }) {
  const token = useCustomerStore.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
    keepalive: true,
  });
}

/**
 * useCartSync
 *
 * Watches cart store items and syncs to backend with:
 * - 1.5-second debounce: waits for user to stop interacting before firing PUT /cart/sync
 * - Visibility change sendBeacon: fires a last sync when tab is hidden/closed
 * - Snapshot approach for failure recovery: localStorage always holds correct state
 * - Focus/Visibility refresh: Refreshes from backend when tab is focused, ONLY if clean.
 */
export function useCartSync() {
  const items = useCartStore(s => s.items);
  const isDirty = useCartStore(s => s.isDirty);
  const fetchAndMerge = useCartStore(s => s.fetchAndMerge);
  const fetchCart = useCartStore(s => s.fetchCart);
  const syncToBackend = useCartStore(s => s.syncToBackend);
  const isAuthenticated = useCustomerStore(s => s.isAuthenticated);

  const pendingSyncRef = useRef<{ variantId: string; quantity: number }[] | null>(null);
  const prevAuthRef = useRef(isAuthenticated);

  // --- Layer 1: Merge on Login / Clear on Logout ---
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated) {
      // User just logged in — merge guest items with account items
      fetchAndMerge();
    } else if (prevAuthRef.current && !isAuthenticated) {
      // User just logged out — clear local cart, wishlist, and addresses for privacy/clean state
      useCartStore.setState({ items: [], isDirty: false, lastSyncedAt: null });
      
      // Clear wishlist
      import('@/lib/store/useWishlistStore').then(mod => {
        mod.useWishlistStore.setState({ _items: [] });
      }).catch(() => {});

      // Clear addresses
      import('@/lib/store/useAddressStore').then(mod => {
        mod.useAddressStore.setState({ addresses: [] });
      }).catch(() => {});
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, fetchAndMerge]);

  // --- Layer 2: Debounced Background Sync ---
  useEffect(() => {
    // We only trigger sync if isDirty is true
    if (!isDirty) return;

    const timer = setTimeout(async () => {
      if (!useCustomerStore.getState().isAuthenticated) return;
      await syncToBackend();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [items, isDirty, syncToBackend]);

  // --- Layer 3: Visibility/Focus Sync ---
  useEffect(() => {
    const syncFromBackend = () => {
      if (useCustomerStore.getState().isAuthenticated) {
        fetchCart(); // This now internally checks isDirty
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromBackend();
      } else {
        // Last ditch sync when leaving if we have unsaved changes
        const currentState = useCartStore.getState();
        if (useCustomerStore.getState().isAuthenticated && currentState.isDirty) {
          sendBeaconWithAuth(`${BASE_URL}/cart/sync`, buildPayload(currentState.items));
        }
      }
    };

    window.addEventListener('focus', syncFromBackend);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', syncFromBackend);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchCart]); // Removed items dependency

  // --- Layer 4: Initial Mount ---
  useEffect(() => {
    if (useCustomerStore.getState().isAuthenticated) {
      fetchCart();
    }
  }, []);
}