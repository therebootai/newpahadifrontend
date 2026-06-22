"use client";

import { useEffect, useState, useRef } from "react";
import { FiStar, FiMessageSquare, FiSend, FiUser, FiCamera, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { getProductReviews, createReview, Review } from "@/lib/services/review";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { shopApi } from "@/lib/fetchers";

type ReviewSectionProps = {
  productId: string;
};

const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const data = await getProductReviews(productId);
      setReviews(data);
      setLoading(false);
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const averageRating = reviews.length
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div id="reviews-section" className="mt-5 pt-5">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* REVIEW SUMMARY */}
        <div className="lg:w-1/3">
          <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Customer Reviews</h3>
          <div className="mt-6 flex items-center gap-6">
            <div className="text-5xl min-[1920px]:text-6xl font-black text-gray-900">{averageRating}</div>
            <div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={i < Math.round(Number(averageRating)) ? "fill-current" : "text-gray-200"}
                    size={20}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm min-[1920px]:text-base font-semibold text-gray-400 uppercase tracking-widest">
                Based on {reviews.length} reviews
              </p>
            </div>
          </div>

          {/* RATING BARS */}
          <div className="mt-8 space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-600 w-3">{star}</span>
                  <FiStar size={12} className="text-gray-400 fill-current" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-400 w-8">{count}</span>
                </div>
              );
            })}
          </div>

          {/* INFORMATION BOX */}
          <div className="mt-12 p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <FiMessageSquare size={20} className="text-amber-500" />
            </div>
            <h4 className="text-lg min-[1920px]:text-xl font-semibold text-gray-900 mb-2">Verified Reviews Only</h4>
            <p className="text-sm min-[1920px]:text-base text-gray-500 font-medium leading-relaxed mb-6">
              To ensure the highest quality of feedback, we only accept reviews from customers who have purchased this product.
            </p>
            <a
              href="/account/orders"
              className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#222222] text-white text-[10px] min-[1920px]:text-xs font-semibold uppercase tracking-widest transition-all hover:bg-amber-500 shadow-lg shadow-gray-200"
            >
              Rate from My Orders
            </a>
          </div>
        </div>

        {/* REVIEWS LIST */}
        <div className="flex-1">
          <div className="space-y-8">
            {loading ? (
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full" />
                    <div className="flex-1 space-y-4">
                      <div className="h-4 bg-gray-100 rounded w-1/4" />
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className="group flex flex-col sm:flex-row gap-6 p-8 rounded-[2.5rem] bg-white border border-gray-50 transition-all hover:border-amber-100 hover:shadow-xl hover:shadow-gray-100/50">
                  <div className="shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-xl border border-amber-100 uppercase">
                      {typeof review.userId === 'object' ? review.userId.name.charAt(0) : 'A'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-semibold min-[1920px]:text-lg text-gray-900">
                          {typeof review.userId === 'object' ? review.userId.name : 'Verified Customer'}
                        </h5>
                        <p className="text-[10px] min-[1920px]:text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            size={14}
                            className={i < review.rating ? "fill-current" : "text-gray-200"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm min-[1920px]:text-base leading-relaxed font-medium italic">
                      "{review.comment}"
                    </p>
                    
                    {review.images && review.images.length > 0 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
                        {review.images.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                            <img src={img.url} alt="Review" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center rounded-[3rem] border-2 border-dashed border-gray-100 bg-gray-50/50">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <FiMessageSquare size={32} className="text-gray-300" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h4>
                <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium leading-relaxed">
                  Be the first to share your thoughts about this masterpiece!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
