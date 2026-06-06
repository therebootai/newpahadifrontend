import { shopApi } from "@/lib/fetchers";
import { cache } from "react";

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  imagePublicId: string;
  iconUrl?: string;
  iconPublicId?: string;
  parentCategoryId: string | null;
  productCount?: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all root categories (parentCategoryId: null) for listing.
 */
export const getRootCategories = cache(async function getRootCategories(): Promise<Category[]> {
  try {
    const response = await shopApi.get("/categories", {
      params: { parentCategoryId: "null" },
    });

    const rawData = response.data.data || [];
    console.log("Fetched root categories:", rawData);

    const mapCategory = (cat: any): Category => ({
      ...cat,
      id: cat._id,
      children: cat.children ? cat.children.map(mapCategory) : undefined
    });

    return rawData.map(mapCategory);
  } catch (error) {
    console.error("Error fetching root categories:", error);
    return [];
  }
});

/**
 * Extracts all category slugs (including nested children) for SSG generateStaticParams.
 */
export const getAllCategorySlugs = cache(async function getAllCategorySlugs(): Promise<string[]> {
  try {
    const response = await shopApi.get("/categories", {
      params: { parentCategoryId: "null" },
    });

    const slugs: string[] = [];

    const extractSlugs = (categories: any[]) => {
      for (const cat of categories) {
        slugs.push(cat.slug);
        if (cat.children && cat.children.length > 0) {
          extractSlugs(cat.children);
        }
      }
    };

    extractSlugs(response.data.data || []);
    return slugs;
  } catch (error) {
    console.error("Error fetching all category slugs:", error);
    return [];
  }
});

/**
 * Get category tree and flatten to find category by slug.
 * This is needed because there's no direct /categories/slug/:slug endpoint.
 */
export const getCategoryBySlug = cache(async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const response = await shopApi.get("/categories", {
      params: { parentCategoryId: "null" },
    });

    // Helper to flatten category tree and find by slug
    const flattenAndFind = (categories: any[]): any | null => {
      for (const cat of categories) {
        if (cat.slug === slug) {
          return cat;
        }
        if (cat.children && cat.children.length > 0) {
          const found = flattenAndFind(cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    const categories = response.data.data || [];
    const category = flattenAndFind(categories);

    if (!category) return null;

    return {
      ...category,
      id: category._id,
    };
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    return null;
  }
});
