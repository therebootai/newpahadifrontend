'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/fetchers';

export interface Category {
  _id: string;
  id: string; // Mapping for frontend convenience
  name: string;
  slug: string;
  imageUrl: string;
  imagePublicId: string;
  iconUrl?: string;
  iconPublicId?: string;
  parentCategoryId: string | null;
  taxes?: { name: string; slab: number }[];
  effectiveTax?: { name: string; slab: number }[];
  productCount?: number;
  createdAt: string;
  updatedAt: string;
  children?: Category[]; // If backend supports nesting
}

export function useCategories(
  search: string = '', 
  parentCategoryId: string | null | 'all' = 'all',
  options: any = {}
) {
  return useQuery<Category[]>({
    queryKey: ['categories', { search, parentCategoryId }],
    queryFn: async () => {
      const params: any = {};
      
      if (parentCategoryId !== 'all') {
        if (search) params.search = search;
        if (parentCategoryId === 'root') params.parentCategoryId = 'null';
        else if (parentCategoryId !== null) params.parentCategoryId = parentCategoryId;
      }

      const response = await adminApi.get('/categories', { params });
      const rawData = response.data.data || [];
      
      // Recursive function to map _id to id and resolve taxes
      const mapCategories = (list: any[], inheritedTax: any[] = []): Category[] => {
        return list.map((cat: any) => {
          const effectiveTax = (cat.taxes && cat.taxes.length > 0) 
            ? cat.taxes 
            : (cat.effectiveTax && cat.effectiveTax.length > 0) 
              ? cat.effectiveTax 
              : inheritedTax;
          
          return {
            ...cat,
            id: cat._id,
            effectiveTax: effectiveTax,
            children: cat.children ? mapCategories(cat.children, effectiveTax) : []
          };
        });
      };

      const allMapped = mapCategories(rawData);

      if (parentCategoryId === 'all') {
        // Helper to perform a deep inheritance pass on a tree
        const resolveTaxes = (nodes: Category[], inherited: any[] = []): Category[] => {
          return nodes.map(node => {
            const tax = (node.taxes && node.taxes.length > 0) ? node.taxes : inherited;
            return {
              ...node,
              effectiveTax: tax,
              children: resolveTaxes(node.children || [], tax)
            };
          });
        };

        // If the backend ALREADY returns a nested structure (tree), we just return it
        const hasBackendNesting = allMapped.some((cat: any) => cat.children && cat.children.length > 0);
        
        if (hasBackendNesting && !search) {
          return resolveTaxes(allMapped);
        }

        // Otherwise, manually build the tree (common for flat API responses)
        const categoryMap = new Map();
        allMapped.forEach((cat: any) => categoryMap.set(cat.id, cat));
        
        const tree: Category[] = [];
        allMapped.forEach((cat: any) => {
          if (cat.parentCategoryId && categoryMap.has(cat.parentCategoryId)) {
            const parent = categoryMap.get(cat.parentCategoryId);
            // Avoid duplicate children if they were already there
            if (!parent.children.find((c: any) => c.id === cat.id)) {
              parent.children.push(cat);
            }
          } else {
            tree.push(cat);
          }
        });

        const finalTree = resolveTaxes(tree);

        // If search is present, filter the tree but keep parents of matches
        if (search) {
          const searchLower = search.toLowerCase();
          const filterTree = (nodes: Category[]): Category[] => {
            return nodes.reduce((acc: Category[], node: Category) => {
              const children = filterTree(node.children || []);
              if (node.name.toLowerCase().includes(searchLower) || children.length > 0) {
                acc.push({ ...node, children });
              }
              return acc;
            }, []);
          };
          // Filtered tree needs another tax resolution pass because structure changed
          return resolveTaxes(filterTree(finalTree));
        }

        return finalTree;
      }

      return allMapped;
    },
    staleTime: 5 * 60 * 1000,
    ...options
  });
}

export function useEligibleParents(search: string, categoryId?: string, options: any = {}) {
  return useQuery<Category[]>({
    queryKey: ['categories', 'eligible-parents', { search, categoryId }],
    queryFn: async () => {
      if (!search) return [];
      const params: any = { search };
      if (categoryId) params.categoryId = categoryId;
      
      const response = await adminApi.get('/categories/eligible-parents', { params });
      return response.data.data.map((cat: any) => ({
        ...cat,
        id: cat._id
      }));
    },
    enabled: search.length >= 2,
    staleTime: 5 * 60 * 1000,
    ...options
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await adminApi.post('/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await adminApi.patch(`/categories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await adminApi.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
