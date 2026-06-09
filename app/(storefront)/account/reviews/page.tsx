'use client';

import { useEffect, useState } from "react";
import { Star, MessageCircle, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUserReviews, deleteUserReview } from "@/lib/services/review";
import ReviewModal from "@/components/ReviewModal";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  isActive: boolean;
  images?: { url: string; publicId: string }[];
  productId: {
    _id: string;
    title: string;
    image?: string;
    coverImage?: { url: string };
    images?: { url: string }[];
    slug: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getUserReviews();
      setReviews(data as any);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await deleteUserReview(reviewId);
      if (response.success) {
        toast.success(response.message);
        setReviews(prev => prev.filter(r => r._id !== reviewId));
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const handleEditClick = (review: Review) => {
    setSelectedReview(review);
    setEditModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222] tracking-tight mb-1">
            My Reviews
          </h1>
          <p className="text-[12px] font-medium text-[#666666] uppercase tracking-wider">
            Manage your feedback on products
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
          <p className="text-[#666666] font-medium">Loading your reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-xl border border-[#CCCCCC]/20 p-6 hover:border-[#CCCCCC]/50 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Info */}
                <div className="w-full md:w-40 shrink-0">
                  <div className="aspect-square rounded-lg bg-[#F5F5F5] p-3 mb-3">
                    <img 
                      src={
                        review.productId?.image || 
                        review.productId?.coverImage?.url || 
                        (review.productId?.images && review.productId.images[0]?.url) || 
                        "/favicon.png"
                      } 
                      alt="" 
                      className="w-full h-full object-contain mix-blend-multiply" 
                    />
                  </div>
                  <h3 className="text-[13px] font-bold text-[#222222] leading-tight line-clamp-2">{review.productId?.title || "Unknown Product"}</h3>
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5 text-[#FFB800]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "fill-[#FFB800]" : "text-[#EEEEEE]"} />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-[#BBBBBB] uppercase tracking-widest">
                        {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      review.isActive ? "bg-[#00E379]/10 text-[#00E379]" : "bg-[#FFB800]/10 text-[#FFB800]"
                    }`}>
                      {review.isActive ? "Published" : "Under Review"}
                    </span>
                  </div>

                  <p className="text-sm text-[#666666] leading-relaxed italic mb-6">
                    "{review.comment}"
                  </p>

                  <div className="flex items-center gap-5 pt-5 border-t border-[#CCCCCC]/10">
                    <button 
                      onClick={() => handleEditClick(review)}
                      className="text-[11px] font-bold text-[#222222] uppercase tracking-widest flex items-center gap-2 hover:text-amber-500 transition-colors"
                    >
                      <Edit2 size={12} /> Edit Review
                    </button>
                    <button 
                      onClick={() => handleDelete(review._id)}
                      className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-colors"
                    >
                      <Trash2 size={12} /> Delete Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#F5F5F5] rounded-2xl border border-dashed border-[#CCCCCC]">
          <MessageCircle size={40} className="mx-auto text-[#BBBBBB] mb-3" />
          <h3 className="text-lg font-bold text-[#222222] mb-1.5">No reviews yet</h3>
          <p className="text-sm text-[#666666] mb-6">You haven't shared your thoughts on any products yet.</p>
          <a href="/account/orders" className="bg-[#222222] text-white px-6 py-2.5 rounded-full font-bold text-[12px] uppercase tracking-widest hover:bg-amber-500 transition-all inline-block">Review Your Orders</a>
        </div>
      )}

      {selectedReview && (
        <ReviewModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedReview(null);
          }}
          mode="edit"
          reviewId={selectedReview._id}
          productName={selectedReview.productId?.title}
          initialData={{
            rating: selectedReview.rating,
            comment: selectedReview.comment,
            images: selectedReview.images
          }}
          onSuccess={fetchMyReviews}
        />
      )}
    </div>
  );
}
