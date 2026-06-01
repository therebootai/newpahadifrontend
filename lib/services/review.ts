import { shopApi } from "@/lib/fetchers";

export interface ReviewImage {
  url: string;
  publicId: string;
}

export interface Review {
  _id: string;
  userId: string | { _id: string; name: string };
  productId: any;
  rating: number;
  comment: string;
  isActive: boolean;
  images: ReviewImage[];
  createdAt: string;
  updatedAt: string;
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const response = await shopApi.get(`/reviews/product/${productId}`);
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching reviews for product ${productId}:`, error);
    return [];
  }
}

export async function createReview(
  productId: string,
  data: { rating: number; comment: string; images?: ReviewImage[] }
): Promise<{ success: boolean; message: string; data?: Review }> {
  try {
    const response = await shopApi.post(`/reviews/product/${productId}`, data);
    return {
      success: true,
      message: response.data.message || "Review submitted successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error(`Error creating review for product ${productId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to submit review",
    };
  }
}

export async function getUserReviews(): Promise<Review[]> {
  try {
    const response = await shopApi.get("/reviews/user");
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
}

export async function updateReview(
  reviewId: string,
  data: { rating?: number; comment?: string; images?: ReviewImage[] }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await shopApi.patch(`/reviews/${reviewId}`, data);
    return {
      success: true,
      message: response.data.message || "Review updated successfully",
    };
  } catch (error: any) {
    console.error(`Error updating review ${reviewId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update review",
    };
  }
}

export async function deleteUserReview(
  reviewId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await shopApi.delete(`/reviews/${reviewId}`);
    return {
      success: true,
      message: response.data.message || "Review deleted successfully",
    };
  } catch (error: any) {
    console.error(`Error deleting review ${reviewId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete review",
    };
  }
}
