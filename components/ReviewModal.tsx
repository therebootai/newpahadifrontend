"use client";

import { useState, useRef, useEffect } from "react";
import { FiStar, FiCamera, FiX, FiSend, FiLoader } from "react-icons/fi";
import { toast } from "sonner";
import { shopApi } from "@/lib/fetchers";
import { useCustomerStore } from "@/lib/store/useCustomerStore";

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  initialData?: { rating: number; comment: string; images?: { url: string; publicId: string }[] };
  reviewId?: string;
};

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  productId, 
  productName, 
  onSuccess,
  mode = "create",
  initialData,
  reviewId
}: ReviewModalProps) => {
  const [rating, setRating] = useState(initialData?.rating ?? 5);
  const [comment, setComment] = useState(initialData?.comment ?? "");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [images, setImages] = useState<{ url: string; file?: File; publicId?: string; isExisting?: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthenticated } = useCustomerStore();

  useEffect(() => {
    if (isOpen) {
      setRating(initialData?.rating ?? 5);
      setComment(initialData?.comment ?? "");
      setImages(initialData?.images?.map(img => ({ url: img.url, publicId: img.publicId, isExisting: true })) ?? []);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error("You can only upload up to 5 images");
      return;
    }

    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      if (updated[index].file) {
        URL.revokeObjectURL(updated[index].url);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to write a review");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("rating", rating.toString());
      formData.append("comment", comment);
      
      // Append existing server images back as JSON if we are editing
      const oldImagesToKeep = images.filter(img => img.isExisting);
      if (oldImagesToKeep.length > 0) {
        oldImagesToKeep.forEach((img, i) => {
          formData.append(`images[${i}][url]`, img.url);
          formData.append(`images[${i}][publicId]`, img.publicId || "");
        });
      }

      // Append new files
      images.forEach((img) => {
        if (img.file) {
          formData.append("images", img.file);
        }
      });

      let response;
      if (mode === "create") {
        response = await shopApi.post(`/reviews/product/${productId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await shopApi.patch(`/reviews/${reviewId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (response.data.success) {
        toast.success(response.data.message || `Review ${mode === "create" ? "submitted" : "updated"} successfully`);
        if (mode === "create") {
          setComment("");
          setRating(5);
          setImages([]);
        }
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.data.message || "Failed to process review");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{mode === "create" ? "Write a Review" : "Edit Your Review"}</h3>
            {productName && <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-1">For {productName}</p>}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <FiStar
                    size={32}
                    className={`${
                      star <= (hoveredRating || rating)
                        ? "text-amber-400 fill-current"
                        : "text-gray-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Your Feedback
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium outline-none focus:border-amber-400 focus:bg-white transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Photos (Max 5)
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-amber-200 shadow-sm">
                  <img src={img.url} className="w-full h-full object-cover" alt="Upload" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-amber-400 hover:text-amber-400 hover:bg-amber-50/50 transition-all"
                >
                  <FiCamera size={24} />
                  <span className="text-[9px] font-bold uppercase mt-1">Add Photo</span>
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-[#222222] text-white text-sm font-bold uppercase tracking-widest transition-all hover:bg-amber-500 disabled:opacity-50 shadow-xl shadow-gray-200"
          >
            {submitting ? (
              <FiLoader className="animate-spin" size={20} />
            ) : (
              <>
                <FiSend size={18} />
                {mode === "create" ? "Post Review" : "Update Review"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
