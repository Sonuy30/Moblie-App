export interface Review {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  productId: string;
  rating: number; // 0.5 to 5
  title?: string;
  comment: string;
  createdAt: string;
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  images?: string[];
}

export interface RatingBreakdown {
  stars: number; // 1 to 5
  count: number;
  percentage: number;
}

export interface RatingSummaryData {
  average: number;
  totalCount: number;
  breakdown: RatingBreakdown[];
}

export interface ReviewsResponse {
  reviews: Review[];
  summary: RatingSummaryData;
  page: number;
  totalPages: number;
  totalCount: number;
}
