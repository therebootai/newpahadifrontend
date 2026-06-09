import { shopApi } from "@/lib/fetchers";
import { cache } from "react";

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
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  variantId?: string;
  stocks?: number;
  effectiveTax?: TaxDetail[];
  attributes?: Record<string, string>;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  categoryId?: string;
  sortBy?: string;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface VariantImage {
  url: string;
  publicId: string;
}

export interface SiblingOption {
  _id: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  attributes: Record<string, string>;
  coverImage: VariantImage;
}

export interface TaxDetail {
  name: string;
  slab: number;
}

export interface VariantDetail {
  _id: string;
  title: string;
  slug: string;
  sku: string;
  price: number;
  mrp: number;
  stocks: number;
  attributes: Record<string, string>;
  coverImage: VariantImage;
  imagesArray: VariantImage[];
  productId: {
    _id: string;
    title: string;
    desc: string;
    specs: { key: string; value: string; _id: string }[];
    brandId: { _id: string; name: string; logoUrl?: string };
    categoryId: { _id: string; name: string };
    returnPolicyType: string;
    returnWindowDays: number;
    rating?: number;
    numReviews?: number;
    isPublished?: boolean;
  };
  isActive: boolean;
  isDefault: boolean;
  effectiveTax?: TaxDetail[];
}

export interface VariantResponse {
  currentVariant: VariantDetail;
  siblingOptions: SiblingOption[];
  effectiveTax?: TaxDetail[];
}

function extractIdString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return String(val._id || val.id || val.$oid || '');
  }
  return String(val);
}

/**
 * Reusable helper to map backend product data to frontend Product interface
 */
export function mapProduct(prod: any): Product {
  const price = prod.displayPrice || prod.price || 0;
  const mrp = prod.displayMrp || prod.mrp || price;
  // Calculate discount if displayDiscount is missing. 
  // If price and mrp are same (or mrp missing), discount is 0.
  const discount = prod.displayDiscount !== undefined 
    ? prod.displayDiscount 
    : (prod.discount !== undefined ? prod.discount : (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0));

  const variantIdStr = extractIdString(prod.defaultVariantId) || extractIdString(prod.variantId) || extractIdString(prod._id || prod.id);

  return {
    ...prod,
    id: extractIdString(prod._id || prod.id),
    brand: typeof prod.brandId === 'object' ? (prod.brandId?.name || "Generic") : "Generic",
    categoryName: typeof prod.categoryId === 'object' ? (prod.categoryId?.name || "General") : "General",
    image: prod.coverImage?.url || "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=800",
    price,
    mrp,
    discount,
    rating: prod.rating || 0,
    reviews: prod.numReviews || prod.reviews || 0,
    isNew: prod.isNew || false,
    slug: prod.default_slug || prod.slug,
    variantId: variantIdStr,
    categoryId: typeof prod.categoryId === 'object' ? extractIdString(prod.categoryId?._id || prod.categoryId) : extractIdString(prod.categoryId),
    isActive: prod.isActive !== false && prod.defaultVariant?.isActive !== false,
    stocks: prod.stocks ?? prod.defaultVariant?.stocks ?? prod.stock,
    effectiveTax: prod.effectiveTax || prod.defaultVariant?.effectiveTax || null,
    attributes: prod.attributes || prod.defaultVariant?.attributes,
  };
}

export async function getProducts(params: GetProductsParams = {}): Promise<Product[]> {
  try {
    const response = await shopApi.get("/products", {
      params: {
        page: 1,
        limit: 10,
        isPublished: true,
        ...params,
      },
    });

    const data = response.data.data || {};
    const products = Array.isArray(data) ? data : (data.products || []);

    return products
      .filter((prod: any) => prod.isPublished !== false && prod.isActive !== false)
      .map((prod: any) => mapProduct(prod));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await shopApi.get("/products", {
      params: { search: slug }
    });
    
    const data = response.data.data || {};
    const products = Array.isArray(data) ? data : (data.products || []);
    const product = products.find((p: any) => (p.slug === slug || p.default_slug === slug) && p.isPublished !== false && p.isActive !== false);
    
    if (!product) return null;

    return mapProduct(product);
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return null;
  }
}

export const getVariantBySlug = cache(async function getVariantBySlug(slug: string): Promise<VariantResponse | null> {
  try {
    const response = await shopApi.get(`/variants/slug/${slug}`);
    const data = response.data.data;

    // Filter out inactive variants or unpublished products
    if (!data || data.currentVariant?.isActive === false || data.currentVariant?.productId?.isPublished === false) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching variant by slug ${slug}:`, error);
    return null;
  }
});

export async function getSimilarProducts(productId: string): Promise<Product[]> {
  try {
    const response = await shopApi.get(`/products/${productId}/similar`);
    const data = response.data.data || [];
    return data
      .filter((prod: any) => prod.isPublished !== false && prod.isActive !== false)
      .map((prod: any) => mapProduct(prod));
  } catch (error) {
    console.error(`Error fetching similar products for ${productId}:`, error);
    return [];
  }
}

export async function getVariantsByProduct(productId: string): Promise<VariantDetail[]> {
  try {
    const response = await shopApi.get(`/variants/product/${productId}`);
    const data = response.data.data || [];
    return data.filter((v: any) => v.isActive !== false);
  } catch (error) {
    console.error(`Error fetching variants for product ${productId}:`, error);
    return [];
  }
}

export interface ProductsByCategoryResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

// Category Filters Types
export interface BrandWithCount {
  id: string;
  name: string;
  logoUrl?: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface AttributeValue {
  value: string;
  count: number;
}

export interface AttributeFilter {
  label: string;
  values: AttributeValue[];
}

export interface SubcategoryWithCount {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: SubcategoryWithCount[];
}

export interface CategoryFiltersResponse {
  category: {
    _id: string;
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

/**
 * Fetches products by category slug with pagination and sorting.
 * Used for category pages - this is a server-side optimized endpoint.
 */
export async function getProductsByCategorySlug(
  slug: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    subcategoryId?: string;
    attributes?: Record<string, string>;
    search?: string;
  } = {}
): Promise<ProductsByCategoryResponse> {
  const { 
    page = 1, 
    limit = 12, 
    sortBy = "newest", 
    brandId, 
    minPrice, 
    maxPrice, 
    subcategoryId, 
    attributes,
    search
  } = options;

  try {
    const params: Record<string, any> = { page, limit, sortBy };
    if (brandId) params.brandId = brandId;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (subcategoryId) params.subcategoryId = subcategoryId;
    if (search) params.search = search;
    if (attributes && Object.keys(attributes).length > 0) {
      // Backend expects JSON string like: attributes={"Color":"black"}
      params.attributes = JSON.stringify(attributes);
    }

    const response = await shopApi.get(`/products/category/${slug}`, { params });

    const data = response.data.data || {};
    const total = data.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products: (data.products || [])
        .filter((prod: any) => prod.isPublished !== false && prod.isActive !== false)
        .map((prod: any) => mapProduct(prod)),
      total,
      page: data.page || page,
      totalPages,
    };
  } catch (error) {
    console.error(`Error fetching products for category ${slug}:`, error);
    return { products: [], total: 0, page: 1, totalPages: 1 };
  }
}

/**
 * Fetches dynamic filters for a category page.
 * Returns brands with counts, price range, attribute filters, and subcategories.
 * Data is cached on the backend for 15 minutes.
 */
export async function getCategoryFilters(
  slug: string
): Promise<CategoryFiltersResponse | null> {
  try {
    const response = await shopApi.get(`/products/category/${slug}/filters`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching filters for category ${slug}:`, error);
    return null;
  }
}

/**
 * Fetches aggregated home page data including active sections and their products.
 */
export async function getHomeData() {
  try {
    const response = await shopApi.get("/home");
    const data = response.data.data || {};
    const activeSections = data.activeSections || [];
    const latestProducts = (data.latestProducts || [])
      .filter((prod: any) => prod.isPublished !== false && prod.isActive !== false)
      .map((prod: any) => mapProduct(prod));


    return {
      latestProducts,
      activeSections: activeSections.map((section: any) => ({
        ...section,
        products: (section.products || [])
          .filter((prod: any) => prod.isPublished !== false && prod.isActive !== false)
          .map((prod: any) => mapProduct(prod))
      }))
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return { latestProducts: [], activeSections: [] };
  }
}
