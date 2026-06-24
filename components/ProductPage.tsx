"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiShoppingBag,
  FiStar,
  FiTruck,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiShare2,
  FiChevronDown,
  FiChevronUp,
  FiMinus,
  FiPlus,
  FiLock,
  FiHeart as FiHeartIcon,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { Product, VariantResponse } from "@/lib/services/product";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import { shopApi } from "@/lib/fetchers";
import { toast } from "sonner";
import ProductCard from "./ProductCard";
import ReviewSection from "./ReviewSection";
import Link from "next/link";

type ProductPageProps = {
  product?: Product | null;
  variant?: VariantResponse | null;
  similarProducts?: Product[];
};

const fallbackImage =
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1200&auto=format&fit=crop";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const ProductPage = ({ product, variant, similarProducts = [] }: ProductPageProps) => {
  const router = useRouter();
  if (!product && !variant) {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fafafa] py-12 px-4">
        <div className="text-center">
          <div className="mb-6 flex justify-center text-gray-300">
            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Product Not Found</h1>
          <p className="mt-4 text-gray-500">The product you are looking for might have been moved or deactivated.</p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-[#b98b5f] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#a67a52]"
          >
            Go Back Home
          </Link>
        </div>
      </section>
    );
  }

  const currentVariant = variant?.currentVariant;
  const productDetails = currentVariant?.productId;
  const title = currentVariant?.title || product?.title || "Product";

  const description =
    productDetails?.desc ||
    product?.desc ||
    "Explore this premium jewellery piece from Pahadi Collections.";

  const categoryName =
    productDetails?.categoryId?.name ||
    product?.categoryName ||
    "Premium Jewellery";

  const returnPolicy =
    productDetails?.returnPolicyType &&
    productDetails.returnPolicyType.toLowerCase() !== "none"
      ? `${productDetails.returnPolicyType}${
          productDetails.returnWindowDays
            ? ` within ${productDetails.returnWindowDays} days`
            : ""
        }`
      : "No return available";

  const hasReturnPolicy =
    productDetails?.returnPolicyType &&
    productDetails.returnPolicyType.toLowerCase() !== "none";

  const price = currentVariant?.price || product?.price || 0;
  const mrp = currentVariant?.mrp || product?.mrp || price;
  const discount =
    mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : product?.discount || 0;

  const productRating = productDetails?.rating || product?.rating || 0;
  const productReviews = productDetails?.numReviews || product?.reviews || 0;

  const wishlistVariantId =
    currentVariant?._id || product?.variantId || product?.id || "";

  const wishlistProduct: Product = {
    ...(product || {
      id: wishlistVariantId,
      title,
      brand: productDetails?.brandId?.name || "Pahadi Collections",
      categoryName,
      image: currentVariant?.coverImage?.url || fallbackImage,
      price,
      mrp,
      discount,
      rating: productRating,
      reviews: productReviews,
      slug: currentVariant?.slug || wishlistVariantId,
    }),
    id: product?.id || wishlistVariantId,
    title,
    categoryName,
    image: currentVariant?.coverImage?.url || product?.image || fallbackImage,
    price,
    mrp,
    discount,
    variantId: wishlistVariantId,
    slug: currentVariant?.slug || product?.slug || wishlistVariantId,
    rating: productRating,
    reviews: productReviews,
  };

  const wishlistItems = useWishlistStore((state) => state._items);
  const pendingToggles = useWishlistStore((state) => state.pendingToggles);
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);

  const isWishlisted = wishlistItems.some(
    (item) => (item.variantId || item.id) === wishlistVariantId,
  );
  const isWishlistPending = pendingToggles.has(wishlistVariantId);

  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const cartItems = useCartStore((state) => state.items);
  const cartItem = cartItems.find((item) => item.variantId === wishlistVariantId);

  const isOutOfStock = (currentVariant?.stocks !== undefined && currentVariant.stocks <= 0) || currentVariant?.isActive === false;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: wishlistProduct.title,
          text: `Check out this ${wishlistProduct.title} on Pahadi Collections`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleWishlist = async () => {
    if (!wishlistVariantId) return;
    try {
      await toggleWishlist(wishlistVariantId, wishlistProduct);
      if (isWishlisted) {
        toast.error("Removed from Wishlist", { duration: 2000 });
      } else {
        toast.success("Added to Wishlist!", { duration: 2000 });
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleAddToCart = () => {
    if (!wishlistVariantId) return;
    if (isOutOfStock) {
      toast.error("Sorry, this item is out of stock", { duration: 2000 });
      return;
    }

    addItem({
      variantId: wishlistVariantId,
      quantity: 1,
      title: wishlistProduct.title,
      image: wishlistProduct.image,
      price: wishlistProduct.price,
      mrp: wishlistProduct.mrp,
      stock: currentVariant?.stocks,
      slug: currentVariant?.slug || product?.slug || wishlistVariantId,
      attributes: currentVariant?.attributes,
      effectiveTax:
        currentVariant?.effectiveTax ||
        variant?.effectiveTax ||
        product?.effectiveTax ||
        null,
    });
    toast.success("Item added to Cart!", { duration: 2000 });
  };

  const handleBuyNow = () => {
    if (!wishlistVariantId) return;
    if (isOutOfStock) {
      toast.error("Sorry, this item is out of stock", { duration: 2000 });
      return;
    }

    addItem({
      variantId: wishlistVariantId,
      quantity: 1,
      title: wishlistProduct.title,
      image: wishlistProduct.image,
      price: wishlistProduct.price,
      mrp: wishlistProduct.mrp,
      stock: currentVariant?.stocks,
      slug: currentVariant?.slug || product?.slug || wishlistVariantId,
      attributes: currentVariant?.attributes,
      effectiveTax:
        currentVariant?.effectiveTax ||
        variant?.effectiveTax ||
        product?.effectiveTax ||
        null,
    });
    router.push("/checkout");
  };

  const productImages = useMemo(() => {
    const variantImages = [
      currentVariant?.coverImage?.url,
      ...(currentVariant?.imagesArray || []).map((image) => image.url),
    ].filter(Boolean) as string[];

    const images = variantImages.length
      ? variantImages
      : [product?.image || fallbackImage];
    return Array.from(new Set(images));
  }, [currentVariant, product]);

  const [mainImage, setMainImage] = useState(productImages[0]);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

  useMemo(() => {
    setMainImage(productImages[0]);
  }, [productImages]);

  const [activeAccordion, setActiveAccordion] = useState<string | null>("description");
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: "none" });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundImage: `url(${mainImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "300%",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const checkPincode = async () => {
    if (pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setPincodeStatus({ status: "loading" });
    try {
      const pickupPostcode = 
        (product as any)?.pickupWareHouseId?.pinCode || 
        (variant?.currentVariant?.productId as any)?.pickupWareHouseId?.pinCode || 
        "110001";

      const response = await shopApi.get("/shiprocket/serviceability", {
        params: {
          pickup_postcode: pickupPostcode,
          delivery_postcode: pincode,
          weight: "0.5",
          cod: "1"
        }
      });

      if (response.data.success && response.data.data?.status === 200) {
        const srData = response.data.data.data;
        const couriers = srData.available_courier_companies;
        
        if (couriers && couriers.length > 0) {
          const etd = couriers[0].etd;
          setPincodeStatus({
            status: "success",
            message: `Delivery available${etd ? `. Expected by: ${etd}` : ""}`,
          });
        } else {
          setPincodeStatus({
            status: "error",
            message: "No delivery service available for this pincode",
          });
        }
      } else {
        setPincodeStatus({
          status: "error",
          message: response.data.message || "Delivery not available to this location",
        });
      }
    } catch (error: any) {
      setPincodeStatus({
        status: "error",
        message:
          error.response?.data?.message ||
          "Delivery not available to this location",
      });
    }
  };

  return (
    <div className="w-full">
      <section className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 xl:gap-12 items-start relative">
          
          {/* LEFT COLUMN: VISUALS (Sticky on Desktop) */}
          <div className="w-full xl:sticky xl:top-40 z-30">
            {/* Mobile View */}
            <div className="xl:hidden">
              <div className="relative mx-auto max-w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
                <Swiper
                  modules={[Pagination, Autoplay]}
                  pagination={{ clickable: true }}
                  className="product-mobile-swiper"
                  spaceBetween={0}
                  slidesPerView={1}
                  onSwiper={setSwiperInstance}
                  onSlideChange={(swiper) => setMainImage(productImages[swiper.activeIndex])}
                >
                  {productImages.map((img, index) => (
                    <SwiperSlide key={img}>
                      <Image
                        src={img}
                        alt={`${title} - image ${index + 1}`}
                        width={600}
                        height={600}
                        className="aspect-square w-full object-cover rounded-2xl"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Overlay Action Buttons Mobile */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  <button
                    onClick={handleWishlist}
                    disabled={isWishlistPending || !wishlistVariantId}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-white/40 backdrop-blur-md shadow-lg border border-gray-100 transition-all active:scale-90"
                  >
                    {isWishlisted ? (
                      <IoHeart className="text-lg text-red-500" />
                    ) : (
                      <IoHeartOutline className="text-lg text-gray-700" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-white/40 backdrop-blur-md shadow-lg border border-gray-100 transition-all active:scale-90"
                  >
                    <FiShare2 className="text-lg text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Mobile Thumbnails below main image */}
              <div className="mt-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar justify-start">
                {productImages.map((img, index) => (
                  <button
                    key={img}
                    onClick={() => {
                      setMainImage(img);
                      if (swiperInstance) swiperInstance.slideTo(index);
                    }}
                    className={`shrink-0 overflow-hidden rounded-md border-2 transition-all w-16 h-16 ${
                      mainImage === img 
                        ? "border-amber-500" 
                        : "border-gray-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${title} thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden xl:flex gap-4 items-start">
              {/* Thumbnails on Left */}
              <div className="flex flex-col gap-2 shrink-0">
                {productImages.map((img, index) => (
                  <button
                    key={img}
                    onClick={() => setMainImage(img)}
                    className={`shrink-0 overflow-hidden rounded-md border-2 transition-all w-16 h-16 ${
                      mainImage === img 
                        ? "border-amber-500 shadow-sm" 
                        : "border-gray-100 hover:border-amber-200"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${title} thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image Container */}
              <div className="flex-1 space-y-6 relative">
                <div 
                  className="relative mx-auto max-w-112.5 xl:max-w-125 2xl:max-w-150 3xl:max-w-170 overflow-hidden rounded-md bg-white shadow-sm border border-gray-100 group/img flex justify-center cursor-zoom-in"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <Image
                    src={mainImage}
                    alt={title}
                    width={600}
                    height={600}
                    priority
                    className="aspect-square w-full object-cover"
                  />

                  {/* Persistent Action Buttons Desktop */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                    <button
                      onClick={handleWishlist}
                      disabled={isWishlistPending || !wishlistVariantId}
                      className="flex h-10 w-10 items-center justify-center rounded-md bg-white/40 backdrop-blur-md shadow-lg border border-gray-100 transition-all hover:bg-amber-500 hover:text-white group/btn"
                    >
                      {isWishlisted ? (
                        <IoHeart className="text-lg text-red-500 group-hover/btn:text-white" />
                      ) : (
                        <IoHeartOutline className="text-lg text-gray-700 group-hover/btn:text-white" />
                      )}
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex h-10 w-10 items-center justify-center rounded-md bg-white/40 backdrop-blur-md shadow-lg border border-gray-100 transition-all hover:bg-amber-500 hover:text-white group/btn"
                    >
                      <FiShare2 className="text-lg text-gray-700 group-hover/btn:text-white" />
                    </button>
                  </div>
                </div>

                {/* Independent Magnifying Zoom Box - High z-index to stay above details */}
                <div 
                  className="absolute left-[calc(100%+20px)] top-0 w-[120%] h-125 z-100 pointer-events-none transition-opacity duration-300 border-2 border-amber-100 bg-white shadow-2xl rounded-md overflow-hidden hidden xl:block"
                  style={{
                    ...zoomStyle,
                    border: zoomStyle.display === "none" ? "none" : "2px solid #fef3c7"
                  }}
                />

                {/* Desktop Action Buttons */}
                <div className="grid grid-cols-2 gap-4 max-w-112.5 xl:max-w-137.5 2xl:max-w-162.5 mx-auto w-full">
                  {cartItem ? (
                    <div className="flex h-14 items-center justify-between rounded-md bg-[#b98b5f] text-white px-6 shadow-xl shadow-amber-100">
                      <button 
                        onClick={() => updateQuantity(wishlistVariantId!, cartItem.quantity - 1)}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      >
                        <FiMinus size={20} />
                      </button>
                      <span className="text-lg font-bold min-w-[2ch] text-center">{cartItem.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(wishlistVariantId!, cartItem.quantity + 1)}
                        disabled={cartItem.quantity >= (currentVariant?.stocks || 99)}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
                      >
                        <FiPlus size={20} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className={`flex h-14 items-center justify-center gap-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-amber-100 group ${
                        isOutOfStock 
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                          : "bg-[#b98b5f] text-white hover:bg-[#a67a52]"
                      }`}
                    >
                      <FiShoppingBag size={20} />
                      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                  )}

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className={`flex h-14 items-center justify-center gap-3 rounded-md text-sm font-bold uppercase tracking-widest transition-all shadow-xl shadow-green-100 group ${
                      isOutOfStock 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                        : "bg-[#006a4e] text-white hover:bg-[#005a42]"
                    }`}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILS (Natural Scroll) */}
          <div className="flex-1 w-full space-y-4 pr-4 xl:pl-4">
            {/* HEADING */}
            <div>
              <h1 className="text-2xl xl:text-4xl font-bold leading-tight text-gray-900 tracking-tight">
                {title}
              </h1>
            </div>

            {/* RATINGS */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={i < Math.round(productRating) ? "fill-current" : "text-gray-200"}
                    size={14}
                  />
                ))}
              </div>
              <p className="text-[10px] font-bold text-gray-600 min-[1920px]:text-[12px] min-[1920px]:text-semibold uppercase tracking-widest">
                {productRating} Ratings & {productReviews} Reviews
              </p>
            </div>

            {/* PRICE & STOCK */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-start flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatPrice(price)}
                </h2>
                {mrp > price && (
                  <p className="text-lg text-gray-400 line-through font-medium">
                    {formatPrice(mrp)}
                  </p>
                )}
                {discount > 0 && (
                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
                    {discount}% OFF
                  </span>
                )}
              </div>

              <div className="shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                  isOutOfStock 
                    ? "bg-red-50 text-red-600 border border-red-100" 
                    : "bg-green-50 text-green-600 border border-green-100"
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? "bg-red-600" : "bg-green-600"}`} />
                  {isOutOfStock ? "Out of Stock" : "In Stock"}
                </span>
              </div>
            </div>

            {/* PINCODE CHECKER */}
            <div className="mt-4 p-4 max-w-full md:max-w-fit rounded-md bg-gray-50 border border-gray-200">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Check Delivery Availability
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter Pincode"
                  className="w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-xs font-bold focus:border-amber-500 outline-none"
                />
                <button
                  onClick={checkPincode}
                  disabled={pincodeStatus.status === "loading"}
                  className="bg-[#b98b5f] text-white px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-[#a67a52] disabled:opacity-50"
                >
                  {pincodeStatus.status === "loading" ? "..." : "Check"}
                </button>
              </div>
              {pincodeStatus.status !== "idle" && (
                <p className={`mt-2 text-[10px] font-bold ${pincodeStatus.status === "success" ? "text-green-600" : "text-red-500"}`}>
                  {pincodeStatus.message}
                </p>
              )}
            </div>

            {/* VARIANTS SECTION */}
            {variant?.siblingOptions && variant.siblingOptions.length > 1 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Select Style
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {variant.siblingOptions.map((opt) => {
                    const isActive = opt.slug === currentVariant?.slug;
                    const attrLabel = Object.entries(opt.attributes || {})
                      .filter(([k]) => !['discounttype', 'type-single', 'discountType', 'type', 'discount' , 'type'].includes(k.toLowerCase()))
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" / ") || opt.title;
                    
                    return (
                      <Link
                        key={opt._id}
                        href={`/product/${opt.slug}`}
                        className={`px-4 py-2.5 rounded-md border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                          isActive
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-amber-300 hover:text-amber-600"
                        }`}
                      >
                        {attrLabel}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <div
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[10px] min-[1920px]:text-sm min-[1920px]:text-semibold font-bold uppercase ${
                  hasReturnPolicy
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "bg-gray-50 text-gray-500 border border-gray-100"
                }`}
              >
                <FiTruck size={14} />
                Return Policy: {returnPolicy}
              </div>
            </div>

            {/* ACCORDION SECTION */}
            <div className="pt-3 space-y-3">
              {[
                { id: "description", label: "Description", content: <div className="text-xs md:text-[14px] min-[1920px]:text-lg min-[1920px]:leading-relaxed leading-loose text-gray-600" dangerouslySetInnerHTML={{ __html: description }} /> },
                { id: "specs", label: "Specifications", content: (
                  <div className="grid grid-cols-1 gap-2">
                    {(productDetails?.specs?.length ? productDetails.specs : [{ key: "Brand", value: "Pahadi Collections" }, { key: "SKU", value: currentVariant?.sku || "N/A" }]).map((spec) => (
                      <div key={spec.key} className="flex justify-between p-3 min-[1920px]:p-4 rounded-md bg-gray-50/50 border border-gray-200">
                        <span className="text-[10px] md:text-[12px] min-[1920px]:text-lg font-semibold text-gray-600 uppercase">{spec.key}</span>
                        <span className="text-[10px] md:text-[12px] min-[1920px]:text-lg text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                )},
                { id: "reviews", label: "Reviews", content: (
                  <div className="scale-95 origin-top -mt-4">
                    <ReviewSection productId={product?.id || productDetails?._id || ""} />
                  </div>
                )}
              ].map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-md overflow-hidden bg-white">
                  <button 
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-all"
                  >
                    <span className="text-[12px] min-[1920px]:text-[14px] font-semibold text-gray-900 uppercase tracking-widest">{item.label}</span>
                    {activeAccordion === item.id ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {activeAccordion === item.id && <div className="p-4 pt-0 border-t border-gray-50">{item.content}</div>}
                </div>
              ))}
            </div>

            {/* Feature Badges (Grid) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                { icon: <FiTruck />, label: "Free Delivery", sub: "On prepaid orders" },
                { icon: <MdVerified />, label: "Certified Product", sub: "100% Authentic" },
                { icon: <FiLock />, label: "Secure Payment", sub: "Encrypted Gateway" },
                { icon: <FiHeartIcon />, label: "Handmade", sub: "Craftsmanship" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-md border border-gray-100 bg-white hover:shadow-sm">
                  <div className="md:h-14 md:w-14 h-10  w-10 flex items-center justify-center rounded-md bg-amber-50 text-amber-500 text-2xl">
                    {f.icon}
                  </div>
                  <div>
                    <h5 className="text-[10px] lg:text-[14px] font-semibold text-gray-900 uppercase">{f.label}</h5>
                    <p className="text-[11px] lg:text-[12px] text-gray-400 font-medium">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {similarProducts.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-8 pb-12">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">You May Also Like</h3>
              <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Based on your interests</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {similarProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                title={p.title}
                image={p.image}
                price={formatPrice(p.price)}
                oldPrice={p.mrp > p.price ? formatPrice(p.mrp) : undefined}
                discount={p.discount > 0 ? `${p.discount}% OFF` : undefined}
                categoryName={p.categoryName}
                href={`/product/${p.slug}`}
                variantId={p.variantId}
              />
            ))}
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] xl:hidden">
        <div className="flex gap-3 max-w-lg mx-auto">
          {cartItem ? (
            <div className="flex h-12 flex-1 items-center justify-between rounded-md bg-[#b98b5f] text-white px-4">
              <button 
                onClick={() => updateQuantity(wishlistVariantId!, cartItem.quantity - 1)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <FiMinus size={16} />
              </button>
              <span className="text-sm font-bold">{cartItem.quantity}</span>
              <button 
                onClick={() => updateQuantity(wishlistVariantId!, cartItem.quantity + 1)}
                disabled={cartItem.quantity >= (currentVariant?.stocks || 99)}
                className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30"
              >
                <FiPlus size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-md text-xs font-bold uppercase tracking-widest border-2 ${
                isOutOfStock ? "bg-gray-50 border-gray-200 text-gray-400" : "bg-[#b98b5f] border-[#b98b5f] text-white"
              }`}
            >
              <FiShoppingBag /> Add
            </button>
          )}
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-md text-xs font-bold uppercase tracking-widest shadow-lg ${
              isOutOfStock ? "bg-gray-300 text-gray-400" : "bg-[#006a4e] text-white"
            }`}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
