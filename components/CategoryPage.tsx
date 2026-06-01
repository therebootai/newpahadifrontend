"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/services/product";

import { HiChevronDown } from "react-icons/hi";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";

type CategoryPageProps = {
  products: Product[];
  total: number;
  categoryName?: string;
  categorySlug?: string;
  categories: {
    name: string;
    slug: string;
    productCount?: number;
    children?: {
      name: string;
      slug: string;
      productCount?: number;
    }[];
  }[];
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const CategoryPage = ({
  products,
  total,
  categoryName = "Jewellery Collection",
  categorySlug,
  categories,
}: CategoryPageProps) => {
  const [sortBy, setSortBy] = useState("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [priceRange, setPriceRange] = useState<number>(10000);

  const toggleCategory = (slug: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [slug]: !prev[slug]
    }));
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.isActive !== false);
    
    result = result.filter(p => p.price <= priceRange);

    return result.sort((a, b) => {
      if (sortBy === "lowToHigh") return a.price - b.price;
      if (sortBy === "highToLow") return b.price - a.price;
      return 0;
    });
  }, [products, sortBy, priceRange]);

  return (
    <section className="w-full lg:h-[calc(100vh-120px)] lg:overflow-hidden flex flex-col pt-0">
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between shrink-0 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl tracking-tight">
            {categoryName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Explore our premium jewellery collection
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-all lg:hidden"
          >
            <HiOutlineAdjustmentsHorizontal className="text-xl" />
            Filters
          </button>

          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-all"
            >
              <span className="text-gray-400 font-medium normal-case tracking-normal mr-1">Sort by:</span>
              <span>
                {sortBy === "latest"
                  ? "Latest"
                  : sortBy === "lowToHigh"
                  ? "Price: Low to High"
                  : "Price: High to Low"}
              </span>
              <HiChevronDown
                className={`transition-all duration-300 text-lg ${
                  sortOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 transition-all duration-300 ${
                sortOpen
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-2 opacity-0"
              }`}
            >
              {[
                { label: "Latest Arrivals", value: "latest" },
                { label: "Price: Low to High", value: "lowToHigh" },
                { label: "Price: High to Low", value: "highToLow" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setSortBy(item.value);
                    setSortOpen(false);
                  }}
                  className={`w-full px-5 py-4 text-left text-sm font-bold transition-all first:rounded-t-2xl last:rounded-b-2xl ${
                    sortBy === item.value
                      ? "bg-amber-500 text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative flex-1 min-h-0">
        {/* Sidebar - Sticky */}
        <aside
          className={`fixed lg:sticky lg:top-0 left-0 top-0 z-[60] h-full lg:h-full w-80 lg:w-[300px] overflow-y-auto no-scrollbar bg-white lg:bg-transparent transition-all duration-300 border-r lg:border-none border-gray-100 p-6 lg:p-0 shrink-0 ${
            mobileFilterOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <HiOutlineAdjustmentsHorizontal size={24} />
            </button>
          </div>

          <div className="space-y-8 lg:bg-white lg:rounded-3xl lg:border lg:border-gray-100 lg:p-7 lg:shadow-sm pb-24 lg:pb-12">
            {/* Categories List */}
            <div>
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-5 px-1">Collections</h3>
              <div className="space-y-1.5">
                <Link
                  href="/category/all-jewellery"
                  onClick={() => setMobileFilterOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-300 group ${
                    categorySlug === "all-jewellery"
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-amber-500"
                  }`}
                >
                  <span>All Jewellery</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${categorySlug === "all-jewellery" ? "bg-white" : "bg-transparent group-hover:bg-amber-500"}`}></div>
                </Link>
                
                {categories.map((category) => (
                  <div key={category.slug} className="space-y-1">
                    <Link
                      href={`/category/${category.slug}`}
                      onClick={() => setMobileFilterOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-300 group ${
                        categorySlug === category.slug
                          ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-amber-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{category.name}</span>
                        {category.productCount !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categorySlug === category.slug ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600"}`}>
                            {category.productCount}
                          </span>
                        )}
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${categorySlug === category.slug ? "bg-white" : "bg-transparent group-hover:bg-amber-500"}`}></div>
                    </Link>
                    
                    {category.children && category.children.length > 0 && (
                      <div className="ml-4 pl-4 border-l border-gray-100 space-y-1 my-2">
                        {category.children.map((child) => (
                          <Link
                            key={child.slug}
                            href={`/category/${child.slug}`}
                            onClick={() => setMobileFilterOpen(false)}
                            className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-300 group ${
                              categorySlug === child.slug
                                ? "text-amber-500 bg-amber-50"
                                : "text-gray-500 hover:text-amber-500 hover:bg-gray-50/50"
                            }`}
                          >
                            <span>{child.name}</span>
                            {child.productCount !== undefined && (
                              <span className="text-[9px] opacity-50">{child.productCount}</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-8 border-t border-gray-50">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 px-1">Price Range</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="mt-4 flex items-center justify-between">
                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-tighter">Min</span>
                    <span className="text-xs font-bold text-gray-700">₹0</span>
                  </div>
                  <div className="h-px w-4 bg-gray-200" />
                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-right">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-tighter">Max</span>
                    <span className="text-xs font-bold text-gray-700">{formatPrice(priceRange)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid - Independent Scroll */}
        <div className="flex-1 w-full lg:h-full lg:overflow-y-auto no-scrollbar pb-20 lg:pb-12">
          <div className="mb-6 flex items-center justify-between px-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
              Showing <span className="text-gray-900 font-bold">{total || filteredProducts.length}</span> Masterpieces
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 lg:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.image}
                  title={product.title}
                  price={formatPrice(product.price)}
                  oldPrice={
                    product.mrp > product.price
                      ? formatPrice(product.mrp)
                      : undefined
                  }
                  discount={
                    product.discount ? `${product.discount}% OFF` : undefined
                  }
                  href={`/product/${product.slug}`}
                  categoryName={product.categoryName}
                  product={product}
                  variantId={product.variantId || product.id}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[40px] border-2 border-dashed border-gray-100 bg-gray-50/50 p-20 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <HiOutlineAdjustmentsHorizontal size={32} className="text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No items found</h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium leading-relaxed">
                We couldn't find any products matching your current filters. Try adjusting your selection.
              </p>
            </div>
          )}
        </div>
      </div>

      {mobileFilterOpen && (
        <div
          onClick={() => setMobileFilterOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
        />
      )}
    </section>
  );
};

export default CategoryPage;
