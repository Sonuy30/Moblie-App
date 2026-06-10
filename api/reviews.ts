import type { AxiosError } from 'axios';
import client from './client';
import { Config } from '@/utils/config';
import type { Review, ReviewsResponse } from '@/types/review';
export type { Review, ReviewsResponse };

function isBackendMissing(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const axiosError = err as AxiosError;
  if (!axiosError.response) return true;
  if (axiosError.response.status === 405 || axiosError.response.status === 404) return true;
  return false;
}

// In-memory mock review database for development fallback
const MOCK_REVIEWS_DB: Record<string, Review[]> = {
  'prod-001': [
    {
      _id: 'rev-1',
      userId: 'u1',
      userName: 'Amit Patel',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      productId: 'prod-001',
      rating: 5,
      title: 'Top Grade Structural Steel',
      comment: 'Excellent finish and weight as stated. Used these in our industrial warehouse build. Very robust and highly recommended.',
      createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
      isVerifiedPurchase: true,
      helpfulCount: 24,
      images: [
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=80',
      ],
    },
    {
      _id: 'rev-2',
      userId: 'u2',
      userName: 'Rajesh Kumar',
      productId: 'prod-001',
      rating: 4.5,
      title: 'Good Quality & Fast Delivery',
      comment: 'Satisfactory weight and surface quality. Shipping to Lucknow took 3 days which was within our schedule.',
      createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      isVerifiedPurchase: true,
      helpfulCount: 12,
    },
    {
      _id: 'rev-3',
      userId: 'u3',
      userName: 'Deepak Verma',
      productId: 'prod-001',
      rating: 3.5,
      comment: 'Standard angle bars. Dimensions are correct but had some surface rust spots due to rain during transport. Quality is okay.',
      createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
      isVerifiedPurchase: false,
      helpfulCount: 3,
    },
    {
      _id: 'rev-4',
      userId: 'u4',
      userName: 'Sanjay Sharma',
      productId: 'prod-001',
      rating: 5,
      title: 'ISI certified',
      comment: 'Tested these at our site. High tensile strength, strictly matches ISI tolerances. Extremely happy with the price.',
      createdAt: new Date(Date.now() - 21 * 24 * 3600000).toISOString(),
      isVerifiedPurchase: true,
      helpfulCount: 18,
    },
  ],
};

/**
 * Fetch reviews and summaries for a product with pagination.
 */
export const getReviews = async (
  productId: string,
  page = 1,
  limit = 3,
  sort = 'newest'
): Promise<ReviewsResponse> => {
  if (Config.USE_MOCK_API) {
    let allReviews = MOCK_REVIEWS_DB[productId] || [];
    if (sort === 'highest') {
      allReviews = [...allReviews].sort((a, b) => b.rating - a.rating);
    } else if (sort === 'lowest') {
      allReviews = [...allReviews].sort((a, b) => a.rating - b.rating);
    } else {
      allReviews = [...allReviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    const startIndex = (page - 1) * limit;
    const paginatedReviews = allReviews.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(allReviews.length / limit);
    const ratings = allReviews.map((r) => r.rating);
    const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.5;
    const breakdown = [5, 4, 3, 2, 1].map((stars) => {
      const count = allReviews.filter((r) => Math.round(r.rating) === stars).length;
      const percentage = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
      return { stars, count, percentage };
    });
    return {
      reviews: paginatedReviews,
      summary: {
        average: Number(average.toFixed(1)),
        totalCount: allReviews.length,
        breakdown,
      },
      page,
      totalPages,
      totalCount: allReviews.length,
    };
  }

  try {
    const { data } = await client.get<ReviewsResponse>(
      `/api/mobile/products/${productId}/reviews`,
      { params: { page, limit, sort } }
    );
    return data;
  } catch (err: unknown) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] getReviews fallback active');
      
      let allReviews = MOCK_REVIEWS_DB[productId] || [];
      
      // Handle mock sorting
      if (sort === 'highest') {
        allReviews = [...allReviews].sort((a, b) => b.rating - a.rating);
      } else if (sort === 'lowest') {
        allReviews = [...allReviews].sort((a, b) => a.rating - b.rating);
      } else {
        allReviews = [...allReviews].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // Pagination slice
      const startIndex = (page - 1) * limit;
      const paginatedReviews = allReviews.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(allReviews.length / limit);

      // Generate rating breakdown counts
      const ratings = allReviews.map((r) => r.rating);
      const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.5;
      
      const breakdown = [5, 4, 3, 2, 1].map((stars) => {
        const count = allReviews.filter((r) => Math.round(r.rating) === stars).length;
        const percentage = allReviews.length > 0 ? (count / allReviews.length) * 100 : 0;
        return { stars, count, percentage };
      });

      return {
        reviews: paginatedReviews,
        summary: {
          average: Number(average.toFixed(1)),
          totalCount: allReviews.length,
          breakdown,
        },
        page,
        totalPages,
        totalCount: allReviews.length,
      };
    }
    throw err;
  }
};

/**
 * Submits a new review.
 */
export const submitReview = async (payload: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  userName?: string;
  userId?: string;
}): Promise<Review> => {
  if (Config.USE_MOCK_API) {
    const newReview: Review = {
      _id: `rev-mock-${Date.now()}`,
      userId: 'current-user',
      userName: 'You (Valued Customer)',
      productId: payload.productId,
      rating: payload.rating,
      title: payload.title,
      comment: payload.comment,
      createdAt: new Date().toISOString(),
      isVerifiedPurchase: true,
      helpfulCount: 0,
      images: payload.images,
    };
    if (!MOCK_REVIEWS_DB[payload.productId]) {
      MOCK_REVIEWS_DB[payload.productId] = [];
    }
    MOCK_REVIEWS_DB[payload.productId].unshift(newReview);
    return newReview;
  }

  try {
    const { data } = await client.post<{ review: Review }>('/api/mobile/reviews', payload);
    return data.review;
  } catch (err: unknown) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] submitReview fallback active');
      const newReview: Review = {
        _id: `rev-mock-${Date.now()}`,
        userId: 'current-user',
        userName: 'You (Valued Customer)',
        productId: payload.productId,
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
        isVerifiedPurchase: true,
        helpfulCount: 0,
        images: payload.images,
      };

      if (!MOCK_REVIEWS_DB[payload.productId]) {
        MOCK_REVIEWS_DB[payload.productId] = [];
      }
      MOCK_REVIEWS_DB[payload.productId].unshift(newReview);
      return newReview;
    }
    throw err;
  }
};

/**
 * Increments helpful count for a review.
 */
export const markHelpful = async (
  reviewId: string
): Promise<{ success: boolean; helpfulCount: number }> => {
  if (Config.USE_MOCK_API) {
    return { success: true, helpfulCount: 1 };
  }

  try {
    const { data } = await client.post<{ success: boolean; helpfulCount: number }>(
      `/api/mobile/reviews/${reviewId}/helpful`
    );
    return data;
  } catch (err: unknown) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] markHelpful fallback active');
      return { success: true, helpfulCount: 1 };
    }
    throw err;
  }
};

/**
 * Verifies if the user is eligible to write a review.
 */
export const verifyProductPurchase = async (productId: string): Promise<boolean> => {
  if (Config.USE_MOCK_API) {
    return true;
  }

  try {
    const { data } = await client.get<{ purchased: boolean }>(
      `/api/mobile/products/${productId}/verify-purchase`
    );
    return data.purchased;
  } catch (err: unknown) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] verifyProductPurchase fallback active (returns true)');
      return true; // Fallback allows testing the screen freely
    }
    throw err;
  }
};

/**
 * Backward compatibility exports
 */
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const res = await getReviews(productId, 1, 50);
  return res.reviews;
};

export const postReview = submitReview;
