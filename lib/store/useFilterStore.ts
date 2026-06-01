import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FilterState {
  selectedBrands: string[];
  priceMin: number;
  priceMax: number;
  attributes: Record<string, string>;
  inStockOnly: boolean;

  // Actions
  setBrands: (brands: string[]) => void;
  toggleBrand: (brandId: string) => void;
  setPriceRange: (min: number, max: number) => void;
  setAttribute: (name: string, value: string) => void;
  removeAttribute: (name: string) => void;
  toggleInStock: () => void;
  clearAll: () => void;
  clearAllWithSubcategory: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      selectedBrands: [],
      priceMin: 0,
      priceMax: 0,
      attributes: {},
      inStockOnly: false,

      setBrands: (brands) => set({ selectedBrands: brands }),

      toggleBrand: (brandId) => {
        const { selectedBrands } = get();
        const newBrands = selectedBrands.includes(brandId)
          ? selectedBrands.filter((id) => id !== brandId)
          : [...selectedBrands, brandId];
        set({ selectedBrands: newBrands });
      },

      setPriceRange: (min, max) => set({ priceMin: min, priceMax: max }),

      setAttribute: (name, value) => {
        const { attributes } = get();
        set({ attributes: { ...attributes, [name]: value } });
      },

      removeAttribute: (name) => {
        const { attributes } = get();
        const newAttributes = { ...attributes };
        delete newAttributes[name];
        set({ attributes: newAttributes });
      },

      toggleInStock: () => set((state) => ({ inStockOnly: !state.inStockOnly })),

      clearAll: () =>
        set({
          selectedBrands: [],
          priceMin: 0,
          priceMax: 0,
          attributes: {},
          inStockOnly: false,
        }),

      clearAllWithSubcategory: () =>
        set({
          selectedBrands: [],
          priceMin: 0,
          priceMax: 0,
          attributes: {},
          inStockOnly: false,
        }),
    }),
    {
      name: 'pahadi-filters',
      partialize: (state) => ({
        // Don't persist - we want clean state on new category visits
        selectedBrands: state.selectedBrands,
        priceMin: state.priceMin,
        priceMax: state.priceMax,
        attributes: state.attributes,
        inStockOnly: state.inStockOnly,
      }),
    }
  )
);