'use client';

import { useState, useEffect } from 'react';
import { shopApi } from '@/lib/fetchers';
import { TaxSlab } from '@/lib/store/useCartStore';

export interface VariantDetails {
  variantId: string;
  effectiveTax: TaxSlab[] | null;
  price: number;
  mrp: number;
}

/**
 * Hook to fetch effectiveTax for a list of variant IDs.
 * Used in checkout to calculate and display tax breakdown.
 */
export function useVariantTaxes(variantIds: string[]) {
  const [variantTaxes, setVariantTaxes] = useState<Record<string, TaxSlab[] | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!variantIds || variantIds.length === 0) {
      setVariantTaxes({});
      return;
    }

    const fetchTaxes = async () => {
      setIsLoading(true);
      try {
        // Fetch each variant's details (includes effectiveTax from backend)
        const results: Record<string, TaxSlab[] | null> = {};

        await Promise.all(
          variantIds.map(async (variantId) => {
            try {
              const res = await shopApi.get(`/variants/${variantId}`);
              const data = res.data?.data;

              if (data?.currentVariant) {
                // From getVariantById response
                const variant = data.currentVariant;
                const product = variant.productId;
                results[variantId] = data.effectiveTax || null;
              } else if (data?.variant) {
                // Alternative response format
                results[variantId] = data.effectiveTax || null;
              } else if (data?.effectiveTax) {
                // Direct response
                results[variantId] = data.effectiveTax;
              }
            } catch (err) {
              console.error(`Failed to fetch tax for variant ${variantId}:`, err);
              results[variantId] = null;
            }
          })
        );

        setVariantTaxes(results);
      } catch (err) {
        console.error('Failed to fetch variant taxes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaxes();
  }, [JSON.stringify(variantIds)]);

  return { variantTaxes, isLoading };
}

/**
 * Fetch effectiveTax for a single variant by ID
 */
export async function fetchVariantEffectiveTax(variantId: string): Promise<TaxSlab[] | null> {
  try {
    const res = await shopApi.get(`/variants/${variantId}`);
    const data = res.data?.data;
    return data?.effectiveTax || null;
  } catch (err) {
    console.error(`Failed to fetch tax for variant ${variantId}:`, err);
    return null;
  }
}

/**
 * Fetch effectiveTax for multiple variants by their IDs
 */
export async function fetchMultipleVariantTaxes(
  variantIds: string[]
): Promise<Record<string, TaxSlab[] | null>> {
  const results: Record<string, TaxSlab[] | null> = {};

  await Promise.all(
    variantIds.map(async (variantId) => {
      try {
        const res = await shopApi.get(`/variants/${variantId}`);
        const data = res.data?.data;
        results[variantId] = data?.effectiveTax || null;
      } catch (err) {
        console.error(`Failed to fetch tax for variant ${variantId}:`, err);
        results[variantId] = null;
      }
    })
  );

  return results;
}