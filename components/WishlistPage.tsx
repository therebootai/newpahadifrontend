"use client";

import { useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { useWishlistStore } from "@/lib/store/useWishlistStore";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const WishlistPage = () => {
  // Safe fallback
  const items = useWishlistStore((state) => state._items || []);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const error = useWishlistStore((state) => state.error);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  useEffect(() => {
    void fetchWishlist();
  }, [fetchWishlist]);

  return (
    <section className="w-full py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
          Wishlist
        </h1>

        <p className="mt-2 text-gray-500">
          Products you saved for later
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading wishlist...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center text-red-600">
          {error}
        </div>
      ) : Array.isArray(items) && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((product: any) => (
            <ProductCard
              key={product.variantId || product._id || product.id}
              image={
                product.image ||
                product.coverImage ||
                "/placeholder.png"
              }
              title={product.title}
              price={formatPrice(product.price || 0)}
              oldPrice={
                product.mrp > product.price
                  ? formatPrice(product.mrp)
                  : undefined
              }
              discount={
                product.discount
                  ? `${product.discount}% OFF`
                  : undefined
              }
              href={`/product/${product.slug}`}
              categoryName={product.categoryName}
              product={product}
              variantId={
                product.variantId ||
                product._id ||
                product.id
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Your wishlist is empty
          </h2>

          <p className="mt-2 text-gray-500">
            Add products to your wishlist and they will appear here.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </section>
  );
};

export default WishlistPage;