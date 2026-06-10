/**
 * api/__tests__/search.test.ts
 *
 * Tests for the Search API layer.
 * Verifies query filtering, category multi-select, price ranges, rating filters, and sorting.
 */

import { searchProducts } from '../search';

describe('Search API — local mock query filtering', () => {
  it('filters products by text query (case-insensitive)', async () => {
    // Search for "pipe" (should match GI Pipe)
    const result = await searchProducts('pipe', {});
    expect(result.products.length).toBeGreaterThan(0);
    result.products.forEach((p) => {
      const match =
        p.name.toLowerCase().includes('pipe') ||
        p.category.toLowerCase().includes('pipe') ||
        p.tags.some((t) => t.includes('pipe'));
      expect(match).toBe(true);
    });
  });

  it('filters products by multiple categories', async () => {
    const categories = ['TMT Bars', 'Pipes & Tubes'];
    const result = await searchProducts('', { categories });
    expect(result.products.length).toBeGreaterThan(0);
    result.products.forEach((p) => {
      expect(categories).toContain(p.category);
    });
  });

  it('filters products by price range', async () => {
    const minPrice = 500;
    const maxPrice = 3000;
    const result = await searchProducts('', { minPrice, maxPrice });
    expect(result.products.length).toBeGreaterThan(0);
    result.products.forEach((p) => {
      expect(p.storePrice).toBeGreaterThanOrEqual(minPrice);
      expect(p.storePrice).toBeLessThanOrEqual(maxPrice);
    });
  });

  it('filters products by rating (minimum rating)', async () => {
    const rating = 4.3;
    const result = await searchProducts('', { rating });
    expect(result.products.length).toBeGreaterThan(0);
    result.products.forEach((p) => {
      expect(p.avgRating).toBeGreaterThanOrEqual(rating);
    });
  });
});

describe('Search API — sorting behavior', () => {
  it('sorts products by price ascending', async () => {
    const result = await searchProducts('', { sortBy: 'price_asc' });
    expect(result.products.length).toBeGreaterThan(1);
    for (let i = 0; i < result.products.length - 1; i++) {
      expect(result.products[i].storePrice).toBeLessThanOrEqual(result.products[i + 1].storePrice);
    }
  });

  it('sorts products by price descending', async () => {
    const result = await searchProducts('', { sortBy: 'price_desc' });
    expect(result.products.length).toBeGreaterThan(1);
    for (let i = 0; i < result.products.length - 1; i++) {
      expect(result.products[i].storePrice).toBeGreaterThanOrEqual(result.products[i + 1].storePrice);
    }
  });

  it('sorts products by popularity (weighted review count × rating)', async () => {
    const result = await searchProducts('', { sortBy: 'popularity' });
    expect(result.products.length).toBeGreaterThan(1);
    for (let i = 0; i < result.products.length - 1; i++) {
      const weightA = result.products[i].reviewCount * result.products[i].avgRating;
      const weightB = result.products[i + 1].reviewCount * result.products[i + 1].avgRating;
      expect(weightA).toBeGreaterThanOrEqual(weightB);
    }
  });
});
