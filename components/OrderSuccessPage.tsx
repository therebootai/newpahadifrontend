"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiCheckCircle, FiPackage, FiShoppingBag, FiArrowRight } from "react-icons/fi";
import { Suspense } from "react";

const SuccessContent = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-75"></div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-md bg-green-50 text-green-500 shadow-sm border border-green-100">
            <FiCheckCircle size={40} />
          </div>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
        Order Placed Successfully!
      </h1>
      <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto font-medium">
        Thank you for shopping with Pahadi Collections. We&apos;ve received your order and are preparing it for shipment.
      </p>

      {orderId && (
        <div className="bg-white border border-gray-100 rounded-md p-5 mb-8 shadow-sm inline-block min-w-70">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order Number</p>
          <p className="text-lg font-bold text-gray-900 tracking-tight">#{orderId}</p>
          <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-center gap-2 text-green-600">
            <FiPackage size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed & Processing</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={orderId ? `/account/orders/${orderId}` : "/account/orders"}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#222222] text-white rounded-md text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-amber-600 shadow-lg shadow-gray-200"
        >
          Order Details
          <FiArrowRight size={14} />
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-gray-100 text-gray-900 rounded-md text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-gray-50"
        >
          <FiShoppingBag size={14} />
          Continue Shopping
        </Link>
      </div>
      
      <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
        A confirmation email has been sent to your registered address.<br />
        Need help? <Link href="/contact" className="text-amber-500 underline">Contact Support</Link>
      </p>
    </div>
  );
};

const OrderSuccessPage = () => {
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-10 px-4 bg-[#fafafa]">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-gray-400 uppercase text-[9px] tracking-widest">Confirming Order...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </section>
  );
};

export default OrderSuccessPage;
