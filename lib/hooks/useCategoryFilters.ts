'use client';

import { useQuery } from '@tanstack/react-query';
import { shopApi } from '@/lib/fetchers';
import type {
  BrandWithCount,
  PriceRange,
  AttributeFilter,
  SubcategoryWithCount,
} from '@/lib/services/product';

export interface CategoryFiltersData {
  category: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    productCount?: number;
  };
  filters: {
    brands: BrandWithCount[];
    priceRange: PriceRange;
    attributes: AttributeFilter[];
  };
  subcategories: SubcategoryWithCount[];
  cachedAt: string;
  expiresAt: string;
}

export function useCategoryFilters(slug: string) {
  return useQuery<CategoryFiltersData | null>({
    queryKey: ['category-filters', slug],
    queryFn: async () => {
      const response = await shopApi.get(`/products/category/${slug}/filters`);
      return response.data.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - matches backend cache TTL
    enabled: !!slug,
  });
}