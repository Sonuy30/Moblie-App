import client from '../client';
import { searchProducts } from '../search';

jest.mock('../client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('Search API — client request mapping', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls client.get with correct query and filters', async () => {
    const mockResponse = {
      products: [
        {
          _id: 'prod-001',
          slug: 'tmt-bar-12mm',
          name: 'TMT Bar 12mm',
          itemCode: 'TMT-12',
          storePrice: 1000,
          mrp: 1200,
          discount: 10,
          minOrderQty: 1,
          unit: 'piece',
          images: [],
          category: 'TMT Bars',
          description: 'TMT bar',
          tags: ['tmt'],
          inStock: true,
          stockQty: 100,
          isFeatured: true,
          avgRating: 4.5,
          reviewCount: 50,
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };

    (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await searchProducts('steel', {
      minPrice: 500,
      maxPrice: 2000,
      rating: 4,
      sortBy: 'price_asc',
      page: 2,
      limit: 10,
    });

    expect(client.get).toHaveBeenCalledWith('/api/mobile/items', {
      params: {
        companySlug: process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01',
        search: 'steel',
        minPrice: 500,
        maxPrice: 2000,
        rating: 4,
        sort: 'price_asc',
        page: 2,
        limit: 10,
      },
      signal: undefined,
    });

    expect(result).toEqual({
      products: mockResponse.products,
      total: 1,
      page: 1,
      totalPages: 1,
    });
  });
});

