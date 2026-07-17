/**
 * e2e/catalog.test.ts
 *
 * Tier 1 & 2 E2E Tests: Search, filtering, and reviews.
 * Verifies categories fetching, product pagination, search queries, sorting strategies,
 * review retrieval, review submission, helpfulness tagging, and purchase validation.
 */

jest.mock('@/utils/config', () => {
  const actual = jest.requireActual('../utils/config');
  return {
    ...actual,
    Config: {
      ...actual.Config,
      USE_MOCK_API: true,
    },
  };
});

import { getCategories, getProducts, getProductBySlug } from '@/api/products';
import { searchProducts } from '@/api/search';
import {
  getReviews,
  submitReview,
  markHelpful,
  verifyProductPurchase,
} from '@/api/reviews';

describe('E2E Catalog, Search, Filtering & Reviews Flows', () => {
  const TEST_PRODUCT_ID = 'prod-001';
  const TEST_PRODUCT_SLUG = 'tmt-bar-12mm';

  // Test 1: Fetch Categories
  it('should fetch category list', async () => {
    const categories = await getCategories();
    expect(categories).toBeDefined();
    expect(categories.length).toBeGreaterThan(0);
  });

  // Test 2: Fetch Products
  it('should fetch products with default pagination', async () => {
    const res = await getProducts();
    expect(res.products).toBeDefined();
    expect(res.products.length).toBeGreaterThan(0);
    expect(res.total).toBeGreaterThan(0);
  });

  // Test 3: Fetch Product by Slug
  it('should fetch a single product by its slug', async () => {
    const product = await getProductBySlug(TEST_PRODUCT_SLUG);
    expect(product).toBeDefined();
    expect(product.slug).toBe(TEST_PRODUCT_SLUG);
    expect(product._id).toBe(TEST_PRODUCT_ID);
  });

  // Test 4: Search Products
  it('should search products with case-insensitivity', async () => {
    const res = await searchProducts('pipe', {});
    expect(res.products.length).toBeGreaterThan(0);
    res.products.forEach((p) => {
      const match =
        p.name.toLowerCase().includes('pipe') ||
        p.category.toLowerCase().includes('pipe') ||
        p.tags.some((t) => t.toLowerCase().includes('pipe'));
      expect(match).toBe(true);
    });
  });

  // Test 5: Search and filter by category
  it('should filter search results by categories', async () => {
    const categories = ['Pipes & Tubes'];
    const res = await searchProducts('', { categories });
    expect(res.products.length).toBeGreaterThan(0);
    res.products.forEach((p) => {
      expect(categories).toContain(p.category);
    });
  });

  // Test 6: Search and filter by price range
  it('should filter search results by price range', async () => {
    const minPrice = 500;
    const maxPrice = 3000;
    const res = await searchProducts('', { minPrice, maxPrice });
    expect(res.products.length).toBeGreaterThan(0);
    res.products.forEach((p) => {
      expect(p.storePrice).toBeGreaterThanOrEqual(minPrice);
      expect(p.storePrice).toBeLessThanOrEqual(maxPrice);
    });
  });

  // Test 7: Search and filter by minimum rating
  it('should filter search results by minimum rating', async () => {
    const minRating = 4.0;
    const res = await searchProducts('', { rating: minRating });
    expect(res.products.length).toBeGreaterThan(0);
    res.products.forEach((p) => {
      expect(p.avgRating).toBeGreaterThanOrEqual(minRating);
    });
  });

  // Test 8: Sort products by price ascending
  it('should sort search results by price ascending', async () => {
    const res = await searchProducts('', { sortBy: 'price_asc' });
    expect(res.products.length).toBeGreaterThan(1);
    for (let i = 0; i < res.products.length - 1; i++) {
      expect(res.products[i].storePrice).toBeLessThanOrEqual(
        res.products[i + 1].storePrice
      );
    }
  });

  // Test 9: Sort products by price descending
  it('should sort search results by price descending', async () => {
    const res = await searchProducts('', { sortBy: 'price_desc' });
    expect(res.products.length).toBeGreaterThan(1);
    for (let i = 0; i < res.products.length - 1; i++) {
      expect(res.products[i].storePrice).toBeGreaterThanOrEqual(
        res.products[i + 1].storePrice
      );
    }
  });

  // Test 10: Sort products by popularity
  it('should sort search results by popularity', async () => {
    const res = await searchProducts('', { sortBy: 'popularity' });
    expect(res.products.length).toBeGreaterThan(1);
    for (let i = 0; i < res.products.length - 1; i++) {
      const popA = res.products[i].reviewCount * res.products[i].avgRating;
      const popB = res.products[i + 1].reviewCount * res.products[i + 1].avgRating;
      expect(popA).toBeGreaterThanOrEqual(popB);
    }
  });

  // Test 11: Get Product Reviews
  it('should get reviews for a product', async () => {
    const res = await getReviews(TEST_PRODUCT_ID);
    expect(res.reviews).toBeDefined();
    expect(res.summary).toBeDefined();
    expect(res.totalCount).toBeGreaterThan(0);
  });

  // Test 12: Submit Product Review
  it('should submit a new review for a product', async () => {
    const comment = 'Excellent quality and high strength steel.';
    const review = await submitReview({
      productId: TEST_PRODUCT_ID,
      rating: 5,
      title: 'Strong Steel',
      comment,
    });
    expect(review._id).toBeDefined();
    expect(review.comment).toBe(comment);
    expect(review.rating).toBe(5);

    // Verify the new review is in the product review list
    const listRes = await getReviews(TEST_PRODUCT_ID, 1, 10);
    const addedReview = listRes.reviews.find((r) => r._id === review._id);
    expect(addedReview).toBeDefined();
  });

  // Test 13: Mark Helpful
  it('should mark a review as helpful', async () => {
    const res = await markHelpful('rev-1');
    expect(res.success).toBe(true);
    expect(res.helpfulCount).toBeGreaterThanOrEqual(1);
  });

  // Test 14: Verify Purchase
  it('should verify product purchase status', async () => {
    const purchased = await verifyProductPurchase(TEST_PRODUCT_ID);
    expect(purchased).toBe(true);
  });
});
