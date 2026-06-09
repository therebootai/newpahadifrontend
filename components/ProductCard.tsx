"use client";

import Image from "next/image";
import Link from "next/link";

import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { FiShoppingBag } from "react-icons/fi";
import { Product } from "@/lib/services/product";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { toast } from "sonner";

type ProductCardProps = {
  image: string;
  title: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  href?: string;
  categoryName?: string;
  product?: Product;
  variantId?: string;
};

const ProductCard = ({
  image,
  title,
  price,
  oldPrice,
  discount,
  href = "/product",
  categoryName = "22KT Gold Jewellery",
  product,
  variantId,
}: ProductCardProps) => {
  const fallbackProduct: Product = {
    id: variantId || href,
    title,
    brand: "Pahadi Collections",
    categoryName,
    image,
    price: Number(price.replace(/[^\d.]/g, "")) || 0,
    mrp: Number(oldPrice?.replace(/[^\d.]/g, "")) || Number(price.replace(/[^\d.]/g, "")) || 0,
    discount: Number(discount?.replace(/[^\d.]/g, "")) || 0,
    rating: 0,
    reviews: 0,
    slug: href.split("/").filter(Boolean).pop() || href,
    variantId,
  };
  const wishlistProduct = product || fallbackProduct;
  const wishlistVariantId = variantId || wishlistProduct.variantId || wishlistProduct.id;

  const wishlisted = useWishlistStore((state) => 
    state._items.some((item) => (item.variantId || item.id) === wishlistVariantId)
  );
  const isPending = useWishlistStore((state) => state.pendingToggles.has(wishlistVariantId));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const addItem = useCartStore((state) => state.addItem);

  const stockValue = (wishlistVariantId as any).stocks ?? (wishlistProduct as any).stock;
  const isOutOfStock = (stockValue !== undefined && stockValue <= 0) || wishlistProduct.isActive === false;

  console.log(stockValue)

  const handleWishlist = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await toggleWishlist(wishlistVariantId, {
        ...wishlistProduct,
        variantId: wishlistVariantId,
      });
      if (wishlisted) {
        toast.error("Removed from Wishlist", { duration: 2000 });
      } else {
        toast.success("Added to Wishlist!", { duration: 2000 });
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!wishlistVariantId) return;

    if (isOutOfStock) {
      toast.error("Item is out of stock", { duration: 2000 });
      return;
    }

    addItem({
      variantId: wishlistVariantId,
      quantity: 1,
      title: wishlistProduct.title,
      image: wishlistProduct.image,
      price: wishlistProduct.price,
      mrp: wishlistProduct.mrp,
      stock: (wishlistProduct as any).stocks ?? (wishlistProduct as any).stock,
      effectiveTax: wishlistProduct.effectiveTax,
      attributes: wishlistProduct.attributes,
    });
    toast.success("Item added to Cart!",{
      duration:2000,
    })
  };

  return (
    <div className="group min-w-0 w-full overflow-hidden rounded-xl bg-white border border-gray-200 transition-all duration-300 hover:shadow-xl">

      {/* IMAGE SECTION */}
      <Link href={href} className="relative block overflow-hidden rounded-t-xl">

        <Image
          src={image}
          alt={title} 
          width={500}
          height={600}
          className={`h-45 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-65 md:h-70 ${isOutOfStock ? 'grayscale opacity-80' : ''}`}
        />

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="bg-white/90 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-red-600 shadow-xl">
              Out of Stock
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/5 opacity-0 transition-all duration-300 group-hover:opacity-100" />

        <button
          onClick={handleWishlist}
          disabled={isPending}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-md"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wishlisted ? (
            <IoHeart className="text-2xl text-red-500" />
          ) : (
            <IoHeartOutline className="text-2xl text-gray-700" />
          )}
        </button>

        {!isOutOfStock && (
          <div className="absolute bottom-4 left-1/2 hidden w-[88%] -translate-x-1/2 translate-y-20 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <button 
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-3 rounded-xl py-2 text-lg font-semibold text-white transition-all duration-300 bg-[#b98b5f] hover:bg-[#a67a52]"
            >
              <FiShoppingBag className="text-xl" />
              Quick Add
            </button>
          </div>
        )}
      </Link>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="truncate text-sm font-semibold text-[#5f4339] sm:text-lg">
            {title}
          </h3>
          <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100 shrink-0">
            <span className="text-[10px] font-bold text-green-700">{wishlistProduct.rating || 0}</span>
            <svg className="w-2.5 h-2.5 text-green-600 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>

        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
          {categoryName}
        </p>

        {/* ATTRIBUTES */}
        {wishlistProduct.attributes && Object.entries(wishlistProduct.attributes).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(wishlistProduct.attributes).map(([k, v]) => (
              <span key={k} className="text-[9px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded">
                {k}: {v as string}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">

          <p className="text-base font-bold text-[#5f4339] sm:text-xl">
            {price}
          </p>

          {oldPrice && (
            <p className="text-xs text-gray-400 line-through sm:text-base">
              {oldPrice}
            </p>
          )}

          {discount && (
            <p className="text-xs font-semibold text-green-600">
              {discount}
            </p>
          )}
        </div>

        {/* Mobile Quick Add Button */}
        {!isOutOfStock && (
          <button 
            onClick={handleAddToCart}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white md:hidden bg-[#b98b5f]"
          >
            <FiShoppingBag className="text-lg" />
            Quick Add
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
