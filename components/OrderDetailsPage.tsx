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
  FiAlertCircle,
  FiXCircle,
  FiFileText,
  FiLoader
} from "react-icons/fi";
import { shopOrderApi, Order, ORDER_STATUS_LABELS, formatOrderDate, formatCurrency } from "@/lib/api/orders";
import { toast } from "sonner";
import ConfirmModal from "./ConfirmModal";

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  item: any;
  pickupAddress: any;
  isPending: boolean;
}

function ReturnModal({ isOpen, onClose, onConfirm, item, pickupAddress, isPending }: ReturnModalProps) {
  const policyType = item.snapshot?.returnPolicyType || 'BOTH';
  const [type, setType] = useState<'return' | 'replace'>(policyType === 'REPLACE' ? 'replace' : 'return');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Return/Replace Item</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <FiXCircle size={20} className="text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Item Info */}
          <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-100 bg-white shrink-0">
              <Image src={item.coverImage || "/placeholder.png"} alt={item.title} fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Policy: {policyType}</p>
            </div>
          </div>

          {/* Request Type */}
          {(policyType === 'BOTH' || policyType === 'RETURN' || policyType === 'REPLACE') && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">What do you want?</label>
              <div className="grid grid-cols-2 gap-3">
                {(policyType === 'BOTH' || policyType === 'RETURN') && (
                  <button 
                    onClick={() => setType('return')}
                    className={`py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-all ${
                      type === 'return' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    Return & Refund
                  </button>
                )}
                {(policyType === 'BOTH' || policyType === 'REPLACE') && (
                  <button 
                    onClick={() => setType('replace')}
                    className={`py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-all ${
                      type === 'replace' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    Replacement
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Reason</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">Select a reason</option>
              <option value="Damaged Product">Product received is damaged</option>
              <option value="Wrong Item">Received the wrong item</option>
              <option value="Quality Issue">Quality not as expected</option>
              <option value="Size/Fit Issue">Size or fit issue</option>
              <option value="Defective">Manufacturing defect</option>
            </select>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Additional Details (Optional)</label>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about the issue..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Pickup Address Confirmation */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <FiMapPin size={14} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Pickup Address</p>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              {pickupAddress.fullName}<br />
              {pickupAddress.addressLine1}, {pickupAddress.city}, {pickupAddress.state} {pickupAddress.postalCode}
            </p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            disabled={isPending}
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            disabled={isPending || !reason}
            onClick={() => onConfirm({ type, reason, customerComment: comment })}
            className="flex-1 py-3 bg-[#222222] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? <FiLoader className="animate-spin" /> : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

const OrderDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [invoicing, setInvoicing] = useState(false);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returning, setReturning] = useState(false);

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

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await shopOrderApi.cancel(order._id, "Cancelled by user from order details page");
      toast.success("Order cancelled successfully");
      setShowCancelModal(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setInvoicing(true);
    try {
      const data = await shopOrderApi.getInvoice(order._id);
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank");
      } else {
        toast.error("Invoice not available yet");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch invoice");
    } finally {
      setInvoicing(false);
    }
  };

  const handleReturnSubmit = async (data: any) => {
    if (!order || !selectedItem) return;
    setReturning(true);
    try {
      await shopOrderApi.createReturnRequest({
        orderId: order._id,
        itemId: selectedItem._id,
        type: data.type,
        reason: data.reason,
        customerComment: data.customerComment,
        pickupAddress: order.shippingAddress!
      });
      toast.success(`${data.type === 'return' ? 'Return' : 'Replacement'} request submitted!`);
      setShowReturnModal(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setReturning(false);
    }
  };

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
          {order.orderStatus === 'delivered' && (
            <button 
              onClick={handleDownloadInvoice}
              disabled={invoicing}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {invoicing ? <FiLoader className="animate-spin" /> : <FiFileText />}
              Invoice
            </button>
          )}

          {(order.orderStatus === 'processing' || order.orderStatus === 'pending_payment' || order.orderStatus === 'shipped') && (
            <button 
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-white border border-red-100 text-red-600 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 transition-colors"
            >
              <FiXCircle />
              Cancel Order
            </button>
          )}

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
                  <div key={idx} className="p-4 flex flex-col gap-4">
                    <div className="flex gap-4">
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
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-bold text-amber-600">{formatCurrency(item.price)}</p>
                          
                          {/* Item Status / Return Action */}
                          <div className="flex flex-col items-end gap-1">
                            {item.itemStatus !== 'active' ? (
                              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 text-gray-500 rounded">
                                {item.itemStatus.replace(/_/g, ' ')}
                              </span>
                            ) : order.orderStatus === 'delivered' && (() => {
                              const deliveredEntry = order.statusHistory?.find((h: any) => h.status === 'delivered');
                              const deliveredAt = deliveredEntry ? new Date(deliveredEntry.timestamp) : null;
                              const windowDays = item.snapshot?.returnWindowDays || 7;
                              const policyType = item.snapshot?.returnPolicyType || 'BOTH';
                              
                              if (policyType === 'NONE') {
                                return <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">No Return Policy</span>;
                              }

                              if (!deliveredAt) return null;

                              const expiryDate = new Date(deliveredAt);
                              expiryDate.setDate(expiryDate.getDate() + windowDays);
                              const isExpired = new Date() > expiryDate;
                              const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                              if (isExpired) {
                                return <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">Return Window Expired</span>;
                              }

                              return (
                                <>
                                  <button 
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setShowReturnModal(true);
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors"
                                  >
                                    Return/Replace
                                  </button>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">
                                    {daysLeft} days left to {policyType === 'BOTH' ? 'return' : policyType.toLowerCase()}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
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
                    
                    {shipment.currentStatus && (
                      <div className="space-y-3 px-2">
                        <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                          <FiCheckCircle className="text-green-500 shrink-0" />
                          <span>Status: <strong className="text-gray-900">{shipment.currentStatus}</strong></span>
                        </div>

                        {shipment.estimatedDelivery && (
                          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                            <FiClock className="text-amber-500 shrink-0" />
                            <span>Est. Delivery: <strong className="text-gray-900">{shipment.estimatedDelivery}</strong></span>
                          </div>
                        )}
                        
                        {shipment.timeline && shipment.timeline.length > 0 && (
                          <div className="mt-4 space-y-4 relative before:absolute before:left-1.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                            {shipment.timeline.map((step: any, stepIdx: number) => (
                              <div key={stepIdx} className="flex gap-4 relative">
                                <div className={`w-4 h-4 rounded-full border-4 border-white shrink-0 z-10 ${
                                  stepIdx === 0 ? "bg-amber-500" : "bg-gray-300"
                                } shadow-sm mt-1`} />
                                <div>
                                  <p className={`text-xs font-bold ${stepIdx === 0 ? "text-gray-900" : "text-gray-500"}`}>
                                    {step.activity}
                                  </p>
                                  <p className="text-[10px] font-medium text-gray-400">
                                    {step.location !== 'Unknown' ? `${step.location} | ` : ''}{step.date} {step.time}
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

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="No, Keep It"
        isLoading={cancelling}
      />

      {selectedItem && (
        <ReturnModal
          isOpen={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          onConfirm={handleReturnSubmit}
          item={selectedItem}
          pickupAddress={order.shippingAddress}
          isPending={returning}
        />
      )}
    </div>
  );
};

export default OrderDetailsPage;
