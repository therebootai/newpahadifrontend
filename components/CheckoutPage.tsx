"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiCreditCard,
  FiLock,
  FiMapPin,
  FiTruck,
  FiPlus,
  FiCheckCircle,
  FiTag,
  FiX,
} from "react-icons/fi";
import { useCartStore } from "@/lib/store/useCartStore";
import { useAddressStore } from "@/lib/store/useAddressStore";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import AddressForm from "@/components/AddressForm";
import { shopApi } from "@/lib/fetchers";
import { toast } from "sonner";
import { shopCouponApi, Coupon } from "@/lib/api/shopCoupons";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const CheckoutPage = () => {
  const router = useRouter();
  const { items: cartItems, clearCart, appliedCoupon, setAppliedCoupon, removeCoupon } = useCartStore();
  const { customer, isAuthenticated } = useCustomerStore();
  const { addresses, fetchAddresses, createAddress } = useAddressStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasCompletedOrder = useRef(false);

  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.isActive === false ? 0 : (item.price || 0) * item.quantity),
    0
  );

  const validCartItems = cartItems.filter((item) => item.isActive !== false);

  const discountAmount = appliedCoupon?.calculatedDiscount || 0;
  
  const totalTax = validCartItems.reduce((acc, item) => {
    if (!item.effectiveTax || !item.price) return acc;
    const itemTax = item.effectiveTax.reduce((tAcc, slab) => tAcc + (item.price! * item.quantity * slab.slab) / 100, 0);
    return acc + itemTax;
  }, 0);

  const totalAmount = subtotal - discountAmount;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cartItems.length === 0 && !hasCompletedOrder.current) {
      router.push("/cart");
      return;
    }

    fetchAddresses();
    fetchAvailableCoupons();
  }, [isAuthenticated, cartItems.length, router, fetchAddresses]);

  const fetchAvailableCoupons = async () => {
    setIsLoadingCoupons(true);
    try {
      // Fetch coupons with a high limit to show both applicable and non-applicable ones
      const coupons = await shopCouponApi.getAvailableCoupons(1000000);
      setAvailableCoupons(coupons);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = codeToApply || couponCode;
    if (!code) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsApplying(true);
    try {
      const res = await shopCouponApi.validateCoupon(code, subtotal);
      if (res.valid && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.code,
          type: res.coupon.type,
          value: res.coupon.value,
          maxDiscount: res.coupon.maxDiscount,
          minOrderValue: res.coupon.minOrderValue,
          calculatedDiscount: res.calculatedDiscount,
        });
        toast.success("Coupon applied successfully!");
        setCouponCode("");
        setShowCoupons(false);
      } else {
        toast.error(res.error || "Invalid coupon code");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    } finally {
      setIsApplying(false);
    }
  };

  // Set default address if none selected and addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr._id);
    }
  }, [addresses, selectedAddressId]);

  const handleAddressSubmit = async (data: any) => {
    try {
      await createAddress(data);
      toast.success("Address added successfully");
      setIsAddressFormOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add address");
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!selectedAddress) {
      toast.error("Invalid address selected");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Order
      const orderPayload = {
        items: cartItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        appliedCoupon: appliedCoupon?.code || undefined,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
        },
      };

      const orderRes = await shopApi.post("/orders", orderPayload);
      const order = orderRes.data.data;

      // 2. Initiate Payment
      const initRes = await shopApi.post("/payments/initiate", {
        orderId: order.orderId,
        method: "razorpay",
      });
      const transaction = initRes.data.data;

      // 3. Load Razorpay
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setIsProcessing(false);
        return;
      }

      // 4. Configure Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: transaction.amount,
        currency: transaction.currency,
        name: "Pahadi Collections",
        description: `Payment for Order #${order.orderId}`,
        order_id: transaction.gatewayOrderId,
        handler: async function (response: any) {
          try {
            // 5. Verify Payment
            const verifyRes = await shopApi.post("/payments/verify", {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              toast.success("Payment successful!");
              hasCompletedOrder.current = true;
              clearCart();
              router.push(`/checkout/success?orderId=${order.orderId}`);
            } else {
              toast.error("Payment verification failed");
              router.push(`/account/orders`);
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            toast.error(err.response?.data?.message || "Payment verification failed");
            router.push(`/account/orders`);
          }
        },
        prefill: {
          name: customer?.name || selectedAddress.fullName,
          email: customer?.email || "",
          contact: customer?.phone || selectedAddress.phone,
        },
        notes: {
          address: selectedAddress.addressLine1,
        },
        theme: {
          color: "#b98b5f",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
            setIsProcessing(false);
            router.push(`/account/orders`);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || "Failed to process checkout");
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-500">Initializing Checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#f7f7f7] px-4 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_420px]">
        {/* LEFT SIDE */}
        <div className="space-y-6">
          {/* PAGE TITLE */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="mt-2 text-sm text-gray-500">Complete your order securely</p>
          </div>

          {/* SHIPPING ADDRESS */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100/50">
                  <FiMapPin className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className=" font-semibold text-gray-900 text-sm md:text-base">Delivery Address</h2>
                  <p className="text-xs text-gray-500">Select where to ship your order</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddressFormOpen(true)}
                className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider"
              >
                <FiPlus size={16} /> Add New
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 mb-4">No saved addresses found.</p>
                <button
                  onClick={() => setIsAddressFormOpen(true)}
                  className="px-8 py-3 bg-[#222222] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-amber-500 transition-all shadow-md"
                >
                  Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddressId(addr._id)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedAddressId === addr._id
                        ? "border-amber-500 bg-amber-50/20"
                        : "border-gray-50 hover:border-amber-100 hover:bg-gray-50/50"
                    }`}
                  >
                    {selectedAddressId === addr._id && (
                      <div className="absolute top-4 right-4 text-amber-500 animate-in zoom-in duration-300">
                        <FiCheckCircle size={22} className="fill-white" />
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-[13px] md:text-sm mb-1.5">{addr.fullName}</h3>
                    <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed mb-3">
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {addr.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PAYMENT */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100/50">
                <FiCreditCard className="text-amber-600" size={20} />
              </div>
              <div>
                <h2 className=" font-semibold text-gray-900 text-sm md:text-base">Payment Method</h2>
                <p className="text-xs text-gray-500">Secure online payment via Razorpay</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border-2 border-amber-500 bg-amber-50/20 px-6 py-5">
                <div>
                  <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">Online Payment</p>
                  <p className="text-xs text-gray-500 mt-1">
                    UPI, Cards, NetBanking, Wallets
                  </p>
                </div>
                <div className="h-5 w-5 rounded-full border-[6px] border-amber-500 bg-white"></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:h-fit lg:sticky lg:top-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 mb-4 uppercase tracking-widest text-[13px]">
              Order Summary
            </h2>

            {/* PRODUCT LIST */}
            <div className="max-h-75 overflow-y-auto no-scrollbar space-y-4 mb-8">
              {validCartItems.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shrink-0 w-20 h-20">
                    <Image
                      src={item.image || "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1200&auto=format&fit=crop"}
                      alt={item.title || "Product"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-gray-900 text-[13px] line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Qty: {item.quantity}
                    </p>
                    {item.attributes && Object.entries(item.attributes).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                        {Object.entries(item.attributes).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{k}:</span>
                            <span className="text-[10px] font-bold text-amber-700 uppercase">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-sm font-bold text-[#b98b5f]">
                      {formatCurrency(item.price || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* PRICE DETAILS */}
            <div className="space-y-4 border-t border-gray-50 pt-6">
              {/* Coupon Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Coupons</span>
                  {!appliedCoupon && (
                    <button 
                      onClick={() => setShowCoupons(!showCoupons)}
                      className="text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:underline"
                    >
                      {showCoupons ? "Close" : "View All"}
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                          type="text" 
                          placeholder="ENTER CODE" 
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-10 pr-4 text-xs font-bold uppercase tracking-widest focus:border-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-50"
                        />
                      </div>
                      <button 
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplying || !couponCode}
                        className="rounded-xl bg-[#222222] px-6 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-amber-500 disabled:opacity-50"
                      >
                        {isApplying ? "..." : "Apply"}
                      </button>
                    </div>

                    {showCoupons && (
                      <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Available Coupons</h4>
                        {isLoadingCoupons ? (
                          <div className="py-4 text-center">
                            <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          </div>
                        ) : availableCoupons.length > 0 ? (
                          <div className="space-y-3">
                            {availableCoupons.map((coupon) => {
                              const isNotApplicable = subtotal < coupon.minOrderValue;
                              return (
                                <div key={coupon.code} className={`flex items-center justify-between gap-3 p-3 rounded-xl border shadow-sm transition-all ${
                                  isNotApplicable ? "bg-gray-100/50 border-gray-100 grayscale opacity-70" : "bg-white border-gray-100"
                                }`}>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className={`text-xs font-bold ${isNotApplicable ? "text-gray-400" : "text-gray-900"}`}>{coupon.code}</p>
                                      {isNotApplicable && (
                                        <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">Not Applicable</span>
                                      )}
                                    </div>
                                    <p className={`text-[10px] font-medium ${isNotApplicable ? "text-gray-400" : "text-gray-500"}`}>
                                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                                      {isNotApplicable && ` (Min: ₹${coupon.minOrderValue})`}
                                    </p>
                                  </div>
                                  {!isNotApplicable && (
                                    <button 
                                      onClick={() => handleApplyCoupon(coupon.code)}
                                      className="text-[10px] font-bold text-amber-600 uppercase tracking-widest hover:text-amber-700"
                                    >
                                      Apply
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-medium text-center py-2">No coupons available.</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-green-50/50 border border-green-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <FiTag size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-0.5">Applied Successfully</p>
                      </div>
                    </div>
                    <button 
                      onClick={removeCoupon}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-green-600">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Shipping</span>
                <span className="text-green-600">Free</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">GST (Taxes)</span>
                <span className="text-gray-900">{formatCurrency(totalTax)}</span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-5 mt-2">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-[0.2em]">Total</span>
                <span className="text-2xl font-bold text-amber-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* FEATURES */}
            <div className="mt-8 space-y-3 rounded-2xl bg-[#fafafa] p-5 border border-gray-100">
              <div className="flex items-center gap-3">
                <FiTruck className="text-amber-600" size={16} />
                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Free insured shipping</p>
              </div>
              <div className="flex items-center gap-3">
                <FiLock className="text-amber-600" size={16} />
                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Secure encrypted payment</p>
              </div>
            </div>

            {/* BUTTON */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing || addresses.length === 0}
              className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-[#222222] text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-200"
            >
              {isProcessing ? "Processing..." : "Complete Purchase"}
            </button>

            <p className="mt-5 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
              By placing your order you agree to our<br />
              <span className="text-amber-500 underline">terms & conditions</span>
            </p>
          </div>
        </div>
      </div>

      <AddressForm
        isOpen={isAddressFormOpen}
        onClose={() => setIsAddressFormOpen(false)}
        onSubmit={handleAddressSubmit}
      />
    </section>
  );
};

export default CheckoutPage;
