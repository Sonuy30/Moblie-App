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

// Helper: treat 401/403/404 as "use mock" — same pattern as products.ts
// This prevents the global 401 interceptor from clearing auth credentials
// when product review endpoints require auth but user is browsing as guest.
function shouldUseMock(err: any): boolean {
  if (!err?.response) return true; // network error
  const status = err.response.status;
  return status === 401 || status === 403 || status === 404 || status === 405;
}

const MOCK_REVIEWS: Record<string, Review[]> = {
  'prod-001': [
    { _id: 'rev-001', userId: 'user-1', userName: 'Amit Patel', productId: 'prod-001', rating: 5, title: 'Excellent Quality', comment: 'Excellent quality steel angle bars. Very robust and highly recommended for all structural works.', createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString() },
    { _id: 'rev-002', userId: 'user-2', userName: 'Rajesh Kumar', productId: 'prod-001', rating: 4, title: 'Good Product', comment: 'Good quality, but shipping took an extra day. Overall satisfied with the purchase.', createdAt: new Date(Date.now() - 12 * 24 * 3600000).toISOString() },
    { _id: 'rev-001b', userId: 'user-6', userName: 'Deepak Verma', productId: 'prod-001', rating: 5, title: 'ISI certified — trust it', comment: 'Used in my warehouse construction. Excellent finish and weight as stated. Will order again.', createdAt: new Date(Date.now() - 20 * 24 * 3600000).toISOString() },
  ],
  'prod-002': [
    { _id: 'rev-003', userId: 'user-3', userName: 'Suresh Sharma', productId: 'prod-002', rating: 5, title: 'Top Grade', comment: 'Highly durable mild steel channels. ISI certified and exactly as described. Quick delivery.', createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString() },
    { _id: 'rev-003b', userId: 'user-7', userName: 'Sanjay Rao', productId: 'prod-002', rating: 4, comment: 'Good value for bulk orders. Quality matches description.', createdAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString() },
  ],
  'prod-003': [
    { _id: 'rev-003c', userId: 'user-8', userName: 'Mohan Das', productId: 'prod-003', rating: 4, title: 'Good GI Pipe', comment: 'Galvanization quality is excellent. No rust or scaling observed even after outdoor use.', createdAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString() },
    { _id: 'rev-003d', userId: 'user-9', userName: 'Kiran Shah', productId: 'prod-003', rating: 4, comment: 'Consistent diameter and smooth finish. Recommended for plumbing.', createdAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString() },
  ],
  'prod-004': [
    { _id: 'rev-003e', userId: 'user-10', userName: 'Naresh Gupta', productId: 'prod-004', rating: 5, title: 'Perfect for fabrication', comment: 'Smooth finish and correct dimensions. Used for gate fabrication — perfect outcome.', createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString() },
  ],
  'prod-005': [
    { _id: 'rev-004', userId: 'user-4', userName: 'Vikram Singh', productId: 'prod-005', rating: 5, title: 'Best TMT in segment', comment: 'Best Fe500D TMT bars in this price segment. Outstanding tensile strength and ductility.', createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString() },
    { _id: 'rev-004b', userId: 'user-11', userName: 'Arjun Mishra', productId: 'prod-005', rating: 5, title: 'Highly recommend', comment: 'Used for residential construction. Strong, well-ribbed bars. Delivered on time.', createdAt: new Date(Date.now() - 9 * 24 * 3600000).toISOString() },
  ],
  'prod-006': [
    { _id: 'rev-005', userId: 'user-5', userName: 'Anil Mehta', productId: 'prod-006', rating: 5, title: 'Premium Grade', comment: 'Extremely good ductility and weldability. Used it for our commercial foundation work.', createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString() },
    { _id: 'rev-005b', userId: 'user-12', userName: 'Pradeep Joshi', productId: 'prod-006', rating: 5, comment: 'Certified quality. Very good for earthquake-resistant construction.', createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString() },
  ],
  'prod-008': [
    { _id: 'rev-006', userId: 'user-13', userName: 'Ravi Tiwari', productId: 'prod-008', rating: 4, title: 'Good round bar', comment: 'Nice finish, correct dimensions. Used for machine shaft fabrication. Satisfied.', createdAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString() },
  ],
};

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const { data } = await client.get(`/api/mobile/products/${productId}/reviews`);
    return data.reviews || data || [];
  } catch (err: any) {
    if (shouldUseMock(err)) {
      // Silently fall back — do NOT re-throw so the global 401 interceptor
      // does not clear credentials while user is browsing as a guest.
      console.info(`[REVIEWS] using mock reviews fallback for product: ${productId}`);
      return MOCK_REVIEWS[productId] || [
        {
          _id: 'rev-default',
          userId: 'user-default',
          userName: `${process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01'} Customer`,
          productId,
          rating: 5,
          comment: 'High quality ISI certified product. Perfect for structural use.',
          createdAt: new Date().toISOString()
        }
      ];
    }
    throw err;
  }
};

export const postReview = async (payload: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
}) => {
  try {
    const { data } = await client.post('/api/mobile/reviews', payload);
    return data;
  } catch (err: any) {
    if (shouldUseMock(err)) {
      console.info('[REVIEWS] postReview mock success fallback');
      return { success: true, message: 'Review posted successfully (mock)' };
    }
    throw err;
  }
};
