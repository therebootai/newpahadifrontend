'use client';

import { useEffect, useState } from "react";
import { Package, ChevronRight, Calendar, Clock, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useOrderStore } from "@/lib/store/useOrderStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { useRouter } from "next/navigation";
import ReviewModal from "@/components/ReviewModal";
import Pagination from "@/components/admin/Pagination";
import { toast } from "sonner";
import { shopApi } from "@/lib/fetchers";

export default function OrdersPage() {
  const router = useRouter();
  const { orders, isLoading, pagination, fetchOrders } = useOrderStore();
  const addItem = useCartStore((state) => state.addItem);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (page: number) => {
    fetchOrders({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyAgain = (order: any) => {
    try {
      order.items.forEach((item: any) => {
        addItem({
          variantId: item.variantId,
          quantity: 1, // Default to 1 for Buy Again
          title: item.snapshot.title,
          image: item.snapshot.coverImage,
          price: item.price,
          mrp: item.price, // Fallback if mrp not in snapshot
        });
      });
      toast.success("Added to cart! Redirecting...");
      router.push("/checkout");
    } catch (error) {
      console.error("Buy Again failed", error);
      toast.error("Failed to add items to cart");
    }
  };

  const handleWriteReview = async (productId: string, productName: string, variantId?: string) => {
    let finalProductId = productId;
    
    // Fallback for old orders that don't have productId in snapshot
    if (!finalProductId && variantId) {
      try {
        const response = await shopApi.get(`/variants/${variantId}`);
        if (response.data.success && response.data.data.variant) {
          finalProductId = response.data.data.variant.productId;
        }
      } catch (error) {
        console.error("Failed to fetch variant details for review", error);
      }
    }

    if (!finalProductId) {
      toast.error("Could not identify product for review. Please try from the product page.");
      return;
    }

    setSelectedProduct({ id: finalProductId, name: productName });
    setIsReviewModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222] tracking-tight mb-1">
            My Orders
          </h1>
          <p className="text-[12px] font-medium text-[#666666] uppercase tracking-wider">
            Track and manage your recent purchases
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
          <p className="text-[#666666] font-medium">Loading your orders...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-5">
          {orders.map((order) => {
            // Helper to get primary product info
            const firstItem = order.items?.[0];
            const itemsCount = order.items?.length || 0;

            return (
              <div 
                key={order._id} 
                className="bg-white rounded-xl border border-[#CCCCCC]/20 overflow-hidden hover:border-[#CCCCCC]/50 transition-all group"
              >
                {/* Order Header */}
                <div className="bg-[#F5F5F5] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[9px] font-bold text-[#BBBBBB] uppercase tracking-widest mb-0.5">Order ID</p>
                      <p className="text-sm font-bold text-[#222222]">{order.orderId}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[9px] font-bold text-[#BBBBBB] uppercase tracking-widest mb-0.5">Order Date</p>
                      <p className="text-sm font-bold text-[#666666] flex items-center gap-1.5">
                        <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[#BBBBBB] uppercase tracking-widest mb-0.5">Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          order.orderStatus === "delivered" ? "bg-[#00E379]" : 
                          order.orderStatus === "cancelled" ? "bg-amber-500" : "bg-orange-500 animate-pulse"
                        }`}></span>
                        <span className={`text-[12px] font-bold uppercase tracking-wider ${
                          order.orderStatus === "delivered" ? "text-[#00E379]" : 
                          order.orderStatus === "cancelled" ? "text-amber-500" : "text-orange-500"
                        }`}>
                          {order.orderStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/account/orders/${order._id}`} className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    Order Details <ChevronRight size={14} />
                  </Link>
                </div>

                {/* Order Body */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-4">
                      <Link 
                        href={`/product/${firstItem?.snapshot?.slug || firstItem?.slug || "#"}`}
                        className="w-20 h-20 rounded-lg bg-[#F5F5F5] p-2 flex-shrink-0 transition-opacity hover:opacity-80"
                      >
                        <img src={firstItem?.coverImage || firstItem?.snapshot?.coverImage || "/images/placeholder.png"} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                      </Link>
                      <div>
                        <Link href={`/product/${firstItem?.snapshot?.slug || firstItem?.slug || "#"}`} className="hover:text-amber-600 transition-colors">
                          <h3 className="text-base font-bold text-[#222222] mb-0.5 line-clamp-1">
                            {firstItem?.title || firstItem?.snapshot?.title || "Product Name"}
                            {itemsCount > 1 && <span className="text-[#666666] font-medium ml-2">and {itemsCount - 1} more...</span>}
                          </h3>
                        </Link>
                        {/* Variant Attributes */}
                        {(firstItem?.attributes || firstItem?.snapshot?.attributes) && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                            {Object.entries((firstItem?.attributes || firstItem?.snapshot?.attributes) || {}).map(([k, v]: any) => (
                              <p key={k} className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-1.5 py-0.5 rounded">
                                {k}: {v}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="text-sm font-medium text-[#666666] mb-3">Items: {itemsCount}</p>
                        <div className="flex flex-wrap gap-3">
                          <button 
                            onClick={() => handleBuyAgain(order)}
                            className="text-[11px] font-bold text-[#222222] uppercase tracking-widest bg-[#F5F5F5] px-3.5 py-1.5 rounded-lg hover:bg-[#222222] hover:text-white transition-all"
                          >
                            Buy Again
                          </button>
                          {order.orderStatus === "delivered" && (
                            <button 
                              onClick={() => handleWriteReview(firstItem?.snapshot.productId || "", firstItem?.snapshot.title || "", firstItem?.variantId)}
                              className="text-[11px] font-bold text-[#222222] uppercase tracking-widest border border-[#CCCCCC]/30 px-3.5 py-1.5 rounded-lg hover:border-amber-500 hover:text-amber-500 transition-all flex items-center gap-2"
                            >
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              Write a Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end">
                      <p className="text-[9px] font-bold text-[#BBBBBB] uppercase tracking-widest mb-0.5 text-right">Order Total</p>
                      <p className="text-xl font-bold text-[#222222]">₹{order.totalAmount.toLocaleString()}</p>
                      {order.orderStatus === "processing" && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/5 px-2.5 py-1 rounded-full">
                          <Clock size={12} /> Estimated Delivery: Soon
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-item reviews link */}
                  {order.orderStatus === "delivered" && itemsCount > 1 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Review other items from this order</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.items.slice(1).map((item, idx) => (
                          <Link 
                            key={idx} 
                            href={`/product/${item.snapshot?.slug || item.slug || "#"}`}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-gray-50 transition-all hover:border-amber-200"
                          >
                            <img src={item.snapshot?.coverImage || "/images/placeholder.png"} alt="" className="w-10 h-10 object-contain mix-blend-multiply" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{item.snapshot?.title || item.title || "Product Name"}</p>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault(); // Don't follow link if clicking review
                                  handleWriteReview(item.snapshot?.productId || "", item.snapshot?.title || item.title || "Product", item.variantId);
                                }}
                                className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter hover:underline"
                              >
                                Review Now
                              </button>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#F5F5F5] rounded-2xl border border-dashed border-[#CCCCCC]">
          <Package size={40} className="mx-auto text-[#BBBBBB] mb-3" />
          <h3 className="text-lg font-bold text-[#222222] mb-1.5">No orders yet</h3>
          <p className="text-sm text-[#666666] mb-6">Looks like you haven't placed any orders yet.</p>
          <a href="/" className="bg-amber-500 text-white px-6 py-2.5 rounded-full font-bold text-[12px] uppercase tracking-widest hover:bg-[#222222] transition-all inline-block">Start Shopping</a>
        </div>
      )}

      {selectedProduct && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedProduct(null);
          }}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
        />
      )}
    </div>
  );
}
