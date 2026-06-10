"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMinus, FiPlus, FiTrash2, FiArrowRight, FiTag, FiX } from "react-icons/fi";
import { useCartStore } from "@/lib/store/useCartStore";
import { shopCouponApi, Coupon } from "@/lib/api/shopCoupons";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const CartPage = () => {
  const { items: cartItems, updateQuantity, removeItem, appliedCoupon, removeCoupon } = useCartStore();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.isActive === false ? 0 : (item.price || 0) * item.quantity),
    0
  );

  const discountAmount = appliedCoupon?.calculatedDiscount || 0;

  // Calculate total tax based on each item's effectiveTax slabs
  const totalTax = cartItems.reduce((acc, item) => {
    if (item.isActive === false) return acc;
    if (!item.effectiveTax || item.effectiveTax.length === 0) return acc;
    const itemPrice = item.price || 0;
    const itemTax = item.effectiveTax.reduce((tAcc, slab) => {
      return tAcc + (itemPrice * (slab.slab / 100));
    }, 0);
    return acc + (itemTax * item.quantity);
  }, 0);

  if (cartItems.length === 0) {
    return (
      <section className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="mb-6 flex justify-center text-gray-300">
            <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="mt-4 text-gray-500">Looks like you haven&apos;t added anything to your cart yet.</p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#b98b5f] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#a67a52]"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full lg:h-[calc(100vh-120px)] lg:overflow-hidden flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Shopping Cart
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          Review your selected jewellery items ({cartItems.reduce((a, b) => a + b.quantity, 0)} items)
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start flex-1 min-h-0 relative">
        {/* Cart Items - Independent Scroll */}
        <div className="flex-1 w-full lg:h-full lg:overflow-y-auto no-scrollbar pb-8">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.variantId}
                className="rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sm:p-4 transition-all hover:shadow-md"
              >
                <div className="flex gap-4 sm:gap-6">
                  <Link 
                    href={`/product/${item.slug || "#"}`}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-50 sm:h-32 sm:w-32 border border-gray-100 transition-opacity hover:opacity-80"
                  >
                    <Image
                      src={item.image || "/favicon.png"}
                      alt={item.title || "Product"}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/product/${item.slug || "#"}`} className="hover:text-amber-600 transition-colors">
                      <h3 className="truncate text-sm font-bold text-gray-900 sm:text-lg">
                        {item.title}
                      </h3>
                    </Link>

                    {/* ATTRIBUTES */}
                    {item.attributes && Object.entries(item.attributes).filter(([k]) => !['discounttype', 'type-single', 'discountType', 'type'].includes(k.toLowerCase())).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(item.attributes)
                          .filter(([k]) => !['discounttype', 'type-single', 'discountType', 'type'].includes(k.toLowerCase()))
                          .map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{k}:</span>
                            <span className="text-[11px] font-bold text-amber-700 uppercase">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* STOCK STATUS */}
                    {(item.isActive === false || (item.stock !== undefined && item.stock <= 0)) && (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-lg bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600 border border-red-100">
                          {item.isActive === false ? "Deactivated" : "Out of Stock"}
                        </span>
                      </div>
                    )}
                    {item.isActive !== false && item.stock !== undefined && item.stock > 0 && item.quantity > item.stock && (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-lg bg-orange-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-600 border border-orange-100">
                          Only {item.stock} left in stock
                        </span>
                      </div>
                    )}

                    {/* TAX DISPLAY */}
                    {(item.effectiveTax && item.effectiveTax.length > 0) ? <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.effectiveTax.map((slab, idx) => (
                          <span key={idx} className="inline-flex items-center rounded-lg bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 border border-amber-100">
                            {slab.name} {slab.slab}%
                          </span>
                        ))}
                      </div> : (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center rounded-lg bg-gray-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 border border-gray-100">
                            TAX 0%
                          </span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => removeItem(item.variantId)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                    title="Remove Item"
                  >
                    <FiTrash2 size={20} />
                  </button>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 sm:text-2xl tracking-tight">
                      ₹{item.price?.toLocaleString()}
                    </h4>
                    {item.mrp && item.mrp > (item.price || 0) && (
                      <p className="text-sm text-gray-400 line-through font-medium">
                        ₹{item.mrp.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center rounded-2xl border border-gray-100 bg-gray-50 p-1">
                    <button 
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
                      disabled={item.quantity <= 1}
                    >
                      <FiMinus size={16} />
                    </button>

                    <span className="min-w-8 text-center text-sm font-bold text-gray-900">
                      {item.quantity}
                    </span>

                    <button 
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:bg-white hover:shadow-sm disabled:opacity-30"
                      disabled={item.stock !== undefined && item.quantity >= item.stock}
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary - Fixed/Sticky */}
        <div className="w-full lg:w-96 lg:h-full lg:overflow-y-auto no-scrollbar shrink-0 pb-8 lg:pb-0">
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-t-amber-100/50">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl tracking-tight">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm sm:text-base font-medium text-gray-500">
                <span>Subtotal</span>
                <span className="text-gray-900 font-bold">₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-sm sm:text-base font-medium text-gray-500">
                <span>Shipping Fee</span>
                <span className="font-bold text-green-600 uppercase text-xs tracking-widest">Free</span>
              </div>

              <div className="flex items-center justify-between text-sm sm:text-base font-medium text-gray-500">
                <span>Estimated Tax</span>
                <span className="text-gray-900 font-bold">₹{Math.round(totalTax).toLocaleString()}</span>
              </div>

              <div className="pt-6 mt-6 border-t border-dashed border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900 sm:text-lg uppercase tracking-wider">
                    Total Amount
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-900 tracking-tighter">
                      ₹{Math.round(subtotal + totalTax).toLocaleString()}
                    </span>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1 italic">
                      Final price at checkout
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link 
              href={cartItems.some(i => i.isActive === false || (i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock))) ? "#" : "/checkout"} 
              className={`mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-sm font-bold uppercase tracking-widest text-white transition-all shadow-xl shadow-gray-200 ${
                cartItems.some(i => i.isActive === false || (i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock)))
                ? "bg-gray-400 cursor-not-allowed opacity-50"
                : "bg-[#222222] hover:bg-amber-500"
              }`}
              title={cartItems.some(i => i.isActive === false || (i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock))) ? "Please remove out of stock or deactivated items to proceed" : ""}
              onClick={(e) => {
                if (cartItems.some(i => i.isActive === false || (i.stock !== undefined && (i.stock <= 0 || i.quantity > i.stock)))) {
                  e.preventDefault();
                  toast.error("Please remove out of stock or deactivated items to proceed");
                }
              }}
            >
              Proceed to Checkout
              <FiArrowRight size={20} />
            </Link>

            <div className="mt-6 rounded-2xl bg-amber-50/50 border border-amber-100/50 p-4">
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-400 mt-2 animate-pulse shrink-0" />
                <p className="text-xs leading-relaxed text-amber-900/70 font-medium">
                  Secure checkout with 256-bit encryption. All items are certified authentic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartPage;
