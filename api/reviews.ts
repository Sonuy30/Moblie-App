import client from './client';

export interface Review {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const { data } = await client.get(`/api/store/products/${productId}/reviews`);
  return data.reviews || data || [];
};

export const postReview = async (payload: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
}) => {
  const { data } = await client.post('/api/store/reviews', payload);
  return data;
};
