"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  FiPackage, 
  FiMapPin, 
  FiCreditCard, 
  FiTruck, 
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import { shopOrderApi, Order, ORDER_STATUS_LABELS, formatOrderDate, formatCurrency } from "@/lib/api/orders";
import { toast } from "sonner";

const OrderDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = params.id as string;
        if (!orderId) return;
        const data = await shopOrderApi.getById(orderId);
        setOrder(data);
      } catch (error) {
        console.error("Failed to fetch order details", error);
        toast.error("Could not load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-gray-400 uppercase text-[9px] tracking-widest">Fetching Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <FiAlertCircle size={48} className="text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">The order you're looking for doesn't exist or you don't have access to it.</p>
        <Link href="/account/orders" className="px-6 py-3 bg-[#222222] text-white rounded-md text-[10px] font-bold uppercase tracking-widest">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-amber-500 transition-colors mb-3"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order #{order.orderId}</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Placed on {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-md border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
            order.orderStatus === 'delivered' ? 'bg-green-50 border-green-100 text-green-600' :
            order.orderStatus === 'cancelled' ? 'bg-red-50 border-red-100 text-red-600' :
            'bg-amber-50 border-amber-100 text-amber-600'
          }`}>
            <FiClock />
            {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ITEMS & SUMMARY */}
        <div className="lg:col-span-2 space-y-6">
          {/* ITEMS */}
          <div className="bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <FiPackage className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Order Items</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item: any, idx) => {
                const title = item.snapshot?.title || item.title;
                const image = item.snapshot?.coverImage || item.coverImage;
                
                return (
                  <div key={idx} className="p-4 flex gap-4">
                    <Link 
                      href={`/product/${item.snapshot?.slug || item.slug || "#"}`}
                      className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-100 bg-gray-50 shrink-0 transition-opacity hover:opacity-80"
                    >
                      <Image
                        src={image || "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=1200&auto=format&fit=crop"}
                        alt={title}
                        fill
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <Link href={`/product/${item.snapshot?.slug || item.slug || "#"}`} className="hover:text-amber-600 transition-colors">
                        <h3 className="font-bold text-gray-900 text-[13px] line-clamp-1 mb-1">{title}</h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty: {item.quantity}</p>
                        {(item.attributes || item.snapshot?.attributes) && Object.entries(item.attributes || item.snapshot?.attributes).map(([k, v]: any) => (
                          <p key={k} className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded">
                            {k}: {v}
                          </p>
                        ))}
                      </div>
                      <p className="text-sm font-bold text-amber-600 mt-2">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SHIPMENT TRACKING (IF AVAILABLE) */}
          <div className="bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <FiTruck className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Shipping & Tracking</h2>
            </div>
            <div className="p-4">
              {order.shipments && order.shipments.length > 0 ? (
                order.shipments.map((shipment, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tracking Number</p>
                        <p className="text-sm font-bold text-gray-900">{shipment.trackingNumber || "Assigning Soon..."}</p>
                      </div>
                      {shipment.trackUrl && (
                        <a 
                          href={shipment.trackUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#222222] text-white rounded-md text-[10px] font-bold uppercase tracking-widest text-center"
                        >
                          Track Package
                        </a>
                      )}
                    </div>
                    
                    {shipment.trackingData?.currentStatus && (
                      <div className="space-y-3 px-2">
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                          <FiCheckCircle className="text-green-500 shrink-0" />
                          <span>Status: <strong className="text-gray-900">{shipment.trackingData.currentStatus}</strong></span>
                        </div>
                        
                        {shipment.trackingData.statusSteps && shipment.trackingData.statusSteps.length > 0 && (
                          <div className="mt-4 space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {shipment.trackingData.statusSteps.map((step, stepIdx) => (
                              <div key={stepIdx} className="flex gap-4 relative">
                                <div className={`w-4 h-4 rounded-full border-4 border-white shrink-0 z-10 ${
                                  stepIdx === 0 ? "bg-amber-500" : "bg-gray-300"
                                } shadow-sm mt-1`} />
                                <div>
                                  <p className={`text-xs font-bold ${stepIdx === 0 ? "text-gray-900" : "text-gray-500"}`}>
                                    {step.status}
                                  </p>
                                  <p className="text-[10px] font-medium text-gray-400">
                                    {new Date(step.date).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <FiClock size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {order.orderStatus === 'processing' || order.orderStatus === 'pending_payment' 
                      ? "Shipment details will appear once your order is dispatched."
                      : "No shipment details available for this order."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ADDRESS & PAYMENT SUMMARY */}
        <div className="space-y-6">
          {/* SHIPPING ADDRESS */}
          <div className="bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <FiMapPin className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Delivery Address</h2>
            </div>
            <div className="p-4">
              {order.shippingAddress ? (
                <>
                  <p className="font-bold text-gray-900 text-sm mb-1">{order.shippingAddress.fullName}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    {order.shippingAddress.addressLine1}
                    {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-xs font-bold text-gray-900 tracking-tight">
                    <span className="text-gray-400 uppercase text-[9px] mr-2">Phone:</span>
                    {order.shippingAddress.phone}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400 italic">No shipping address recorded</p>
              )}
            </div>
          </div>

          {/* PAYMENT SUMMARY */}
          <div className="bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
              <FiCreditCard className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Order Summary</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal || order.totalAmount - (order.itemTax || 0))}</span>
              </div>
              
              {order.couponDiscount && order.couponDiscount > 0 && (
                <div className="flex justify-between text-xs font-medium text-green-600">
                  <span className="uppercase text-[10px] font-bold tracking-wider">Discount ({order.appliedCoupon})</span>
                  <span>-{formatCurrency(order.couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Taxes (GST)</span>
                <span className="text-gray-900">{formatCurrency(order.itemTax)}</span>
              </div>

              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>

              <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Grand Total</span>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(order.totalAmount)}</span>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                <p className="text-xs font-bold text-gray-900">{order.paymentMethod || "Online Payment"}</p>
                <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-500'
                }`}>
                  Status: {order.paymentStatus || "Completed"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
