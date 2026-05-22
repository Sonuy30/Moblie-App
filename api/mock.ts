/**
 * Mock data layer for Pankaj Steel Pvt Ltd — ERP Shop App
 * Used when the backend API returns 404/401 (endpoints not built yet on ERP).
 * This lets the app be fully demoed and tested end-to-end.
 *
 * Demo account: phone=9876543210, password=Demo@123, OTP=123456
 */


import type { AuthUser } from '@/stores/authStore';
import type { StoreProduct, ProductListResponse } from './products';

// ──────────────────────────────────────────────────────────
// Demo users store (in-memory for session)
// ──────────────────────────────────────────────────────────
interface MockUser {
  phone: string;
  password: string;
  profile: AuthUser;
}

// A small set of pre-seeded demo accounts
const MOCK_USERS: MockUser[] = [
  {
    phone: '9876543210',
    password: 'Demo@123',
    profile: {
      _id: 'demo-user-001',
      fullName: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul.sharma@example.com',
      role: 'customer',
      companyId: 'AITS_COMP_001',
      companyName: 'Pankaj Steel Pvt Ltd',
      tier: 'premium',
      creditLimit: 50000,
      creditAvailable: 42000,
    },
  },
  {
    phone: '9000000001',
    password: 'test123',
    profile: {
      _id: 'demo-user-002',
      fullName: 'Priya Patel',
      phone: '9000000001',
      email: 'priya.patel@example.com',
      role: 'customer',
      companyId: 'AITS_COMP_001',
      companyName: 'Pankaj Steel Pvt Ltd',
      tier: 'regular',
      creditLimit: 20000,
      creditAvailable: 20000,
    },
  },
];

// OTP store: phone -> { otp, expiry, user }
const OTP_STORE: Record<string, { otp: string; expiry: number; phone: string }> = {};

// Self-registration store
const REGISTERED_USERS: MockUser[] = [];

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function findUser(phone: string): MockUser | undefined {
  return (
    MOCK_USERS.find((u) => u.phone === phone) ||
    REGISTERED_USERS.find((u) => u.phone === phone)
  );
}

function generateMockJWT(user: AuthUser): string {
  // A stable fake token — good for demo sessions
  const payload = btoa(JSON.stringify({ sub: user._id, phone: user.phone, iat: Date.now() }));
  return `mock.${payload}.sig`;
}

// ──────────────────────────────────────────────────────────
// Mock Auth functions
// ──────────────────────────────────────────────────────────

/** Send OTP to phone — always succeeds, OTP is always 123456 in demo */
export async function mockRequestOTP(phone: string): Promise<{ message: string; companyName: string; maskedPhone: string }> {
  await delay(600);
  const otp = '123456'; // Fixed demo OTP
  OTP_STORE[phone] = { otp, expiry: Date.now() + 5 * 60 * 1000, phone };

  return {
    message: 'OTP sent successfully',
    companyName: 'Pankaj Steel Pvt Ltd',
    maskedPhone: `+91 ${phone.slice(0, 2)}****${phone.slice(-2)}`,
  };
}

/** Verify OTP — accepts 123456 always */
export async function mockVerifyOTP(phone: string, otp: string): Promise<{ token: string; authToken: string; user: AuthUser; customer: AuthUser }> {
  await delay(800);

  const stored = OTP_STORE[phone];

  // Accept 123456 as universal OTP, or exact match
  if (otp !== '123456' && (!stored || stored.otp !== otp || Date.now() > stored.expiry)) {
    throw new Error('Invalid or expired OTP. Use 123456 for demo.');
  }

  delete OTP_STORE[phone];

  let user = findUser(phone);
  if (!user) {
    // Auto-register new user on OTP verify
    const newUser: MockUser = {
      phone,
      password: '',
      profile: {
        _id: `user-${Date.now()}`,
        fullName: `Customer ${phone.slice(-4)}`,
        phone,
        role: 'customer',
        companyId: 'AITS_COMP_001',
        companyName: 'Pankaj Steel Pvt Ltd',
        tier: 'regular',
        creditLimit: 10000,
        creditAvailable: 10000,
      },
    };
    REGISTERED_USERS.push(newUser);
    user = newUser;
  }

  const token = generateMockJWT(user.profile);
  return { token, authToken: token, user: user.profile, customer: user.profile };
}

/** Register user: sends OTP to verify phone */
export async function mockRegisterUser(params: { fullName: string; phone: string; password?: string }): Promise<{ message: string; phone: string }> {
  await delay(700);

  if (findUser(params.phone)) {
    // User exists — treat as login flow
    throw new Error('Phone number already registered. Please login instead.');
  }

  // Pre-register without full profile yet (OTP verify will complete it)
  const pending: MockUser = {
    phone: params.phone,
    password: params.password || '',
    profile: {
      _id: `user-${Date.now()}`,
      fullName: params.fullName,
      phone: params.phone,
      role: 'customer',
      companyId: 'AITS_COMP_001',
      companyName: 'Pankaj Steel Pvt Ltd',
      tier: 'regular',
      creditLimit: 10000,
      creditAvailable: 10000,
    },
  };
  REGISTERED_USERS.push(pending);
  OTP_STORE[params.phone] = { otp: '123456', expiry: Date.now() + 5 * 60 * 1000, phone: params.phone };

  return { message: 'OTP sent to your mobile number', phone: params.phone };
}

/** Login with phone + password */
export async function mockLoginUser(params: { phone: string; password?: string }): Promise<{ authToken: string; user: AuthUser }> {
  await delay(800);

  const user = findUser(params.phone);
  if (!user) {
    throw new Error('No account found with this phone number. Please register first.');
  }

  if (user.password && params.password && user.password !== params.password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const token = generateMockJWT(user.profile);
  return { authToken: token, user: user.profile };
}

/** Get profile */
export async function mockGetProfile(userId: string): Promise<{ user: AuthUser }> {
  await delay(300);
  const user = MOCK_USERS.find((u) => u.profile._id === userId) ||
    REGISTERED_USERS.find((u) => u.profile._id === userId);
  if (!user) throw new Error('User not found');
  return { user: user.profile };
}

// ──────────────────────────────────────────────────────────
// Mock Products
// ──────────────────────────────────────────────────────────
const MOCK_PRODUCTS: StoreProduct[] = [
  {
    _id: 'prod-001', slug: 'ms-angle-bar-40x40', name: 'MS Angle Bar 40×40 mm',
    itemCode: 'STL-ANG-4040', storePrice: 4800, mrp: 5200, discount: 8,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: 'High-quality Pankaj Steel mild steel angle bar (L-section) for structural applications. Fabricated under IS 2062 standards with excellent mechanical strength and weldability. Ideal for construction, fabrication, and support frameworks.',
    tags: ['ms', 'angle', 'structural'], inStock: true, stockQty: 240,
    isFeatured: true, avgRating: 4.5, reviewCount: 38,
    weightPerPiece: 21,
    specifications: [
      { key: 'Material', value: 'Mild Steel (IS 2062)' },
      { key: 'Length', value: '6 meters' },
      { key: 'Thickness', value: '5 mm' },
      { key: 'Grade', value: 'E250' },
      { key: 'Est. Weight', value: '21 kg / piece' },
      { key: 'Brand', value: 'Pankaj Steel' },
    ],
  },
  {
    _id: 'prod-002', slug: 'ms-channel-100x50', name: 'MS Channel 100×50 mm',
    itemCode: 'STL-CHN-10050', storePrice: 7200, mrp: 7800, discount: 8,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: 'Standard mild steel channel (C-section) designed for industrial construction, bridges, and heavy-duty frame building. Sourced directly from primary steel mills and quality-checked at Pankaj Steel warehouse.',
    tags: ['ms', 'channel', 'structural'], inStock: true, stockQty: 180,
    isFeatured: true, avgRating: 4.3, reviewCount: 22,
    weightPerPiece: 57,
    specifications: [
      { key: 'Material', value: 'Mild Steel' },
      { key: 'Standard', value: 'IS 2062' },
      { key: 'Length', value: '6 meters' },
      { key: 'Grade', value: 'E250 A' },
      { key: 'Est. Weight', value: '57 kg / piece' },
      { key: 'Brand', value: 'Pankaj Steel' },
    ],
  },
  {
    _id: 'prod-003', slug: 'gi-pipe-20mm', name: 'GI Pipe 20mm (Light Grade)',
    itemCode: 'PIPE-GI-20L', storePrice: 320, mrp: 360, discount: 11,
    minOrderQty: 5, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Pipes & Tubes',
    description: 'Hot-dip galvanized iron pipe with superior corrosion resistance. Ideal for safe water supply networks, domestic plumbing, scaffolding, and irrigation systems. IS 1239 certified.',
    tags: ['gi', 'pipe', 'plumbing'], inStock: true, stockQty: 500,
    isFeatured: false, avgRating: 4.1, reviewCount: 45,
    weightPerPiece: 9,
    specifications: [
      { key: 'Diameter', value: '20mm (¾")' },
      { key: 'Length', value: '6 meters' },
      { key: 'Standard', value: 'IS 1239' },
      { key: 'Coating', value: 'Zinc Galvanized (Hot-Dip)' },
      { key: 'Est. Weight', value: '9 kg / piece' },
    ],
  },
  {
    _id: 'prod-004', slug: 'ms-flat-bar-50x5', name: 'MS Flat Bar 50×5 mm',
    itemCode: 'STL-FLT-5005', storePrice: 3200, mrp: 3500, discount: 9,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: 'Versatile mild steel flat bar for brackets, structural frameworks, supports, and fabrication. Hot-rolled with smooth finish. Used in gates, grilles, machine frames, and general engineering.',
    tags: ['ms', 'flat', 'bar'], inStock: true, stockQty: 320,
    isFeatured: false, avgRating: 4.4, reviewCount: 17,
    weightPerPiece: 12,
    specifications: [
      { key: 'Material', value: 'Mild Steel' },
      { key: 'Standard', value: 'IS 2062' },
      { key: 'Length', value: '6 meters' },
      { key: 'Width × Thickness', value: '50 × 5 mm' },
      { key: 'Est. Weight', value: '12 kg / piece' },
    ],
  },
  {
    _id: 'prod-005', slug: 'tmt-bar-10mm-fe500', name: 'TMT Bar 10mm Fe500D',
    itemCode: 'TMT-10-500', storePrice: 650, mrp: 720, discount: 10,
    minOrderQty: 10, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'TMT Bars',
    description: 'Thermo-Mechanically Treated high-strength reinforcement bars. Certified Fe500D grade for superb seismic resistance and tensile load management. Suitable for all RCC construction from residential to commercial high-rises.',
    tags: ['tmt', 'rebar', 'construction', 'fe500'], inStock: true, stockQty: 1500,
    isFeatured: true, avgRating: 4.7, reviewCount: 91,
    weightPerPiece: 7.4,
    specifications: [
      { key: 'Grade', value: 'Fe 500D (IS 1786)' },
      { key: 'Diameter', value: '10 mm' },
      { key: 'Length', value: '12 meters' },
      { key: 'UTS/YS Ratio', value: '≥ 1.25' },
      { key: 'Est. Weight', value: '7.4 kg / piece' },
      { key: 'Brand', value: 'Pankaj Steel' },
    ],
  },
  {
    _id: 'prod-006', slug: 'tmt-bar-12mm-fe500', name: 'TMT Bar 12mm Fe500D',
    itemCode: 'TMT-12-500', storePrice: 780, mrp: 860, discount: 9,
    minOrderQty: 10, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'TMT Bars',
    description: 'Heavy duty 12mm Fe500D TMT bars for solid structural concrete reinforcement in residential, commercial, and industrial foundations. Superior ductility and earthquake resistance.',
    tags: ['tmt', 'rebar', 'construction', 'fe500'], inStock: true, stockQty: 1200,
    isFeatured: true, avgRating: 4.6, reviewCount: 73,
    weightPerPiece: 10.7,
    specifications: [
      { key: 'Grade', value: 'Fe 500D (IS 1786)' },
      { key: 'Diameter', value: '12 mm' },
      { key: 'Length', value: '12 meters' },
      { key: 'UTS/YS Ratio', value: '≥ 1.25' },
      { key: 'Est. Weight', value: '10.7 kg / piece' },
      { key: 'Brand', value: 'Pankaj Steel' },
    ],
  },
  {
    _id: 'prod-007', slug: 'ms-sheet-2mm', name: 'MS Sheet 2mm (2500×1250)',
    itemCode: 'STL-SHT-2MM', storePrice: 3600, mrp: 3900, discount: 8,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Sheets & Plates',
    description: 'Cold-rolled commercial grade mild steel sheet. Precise thickness profile, excellent flatness, and high surface finish quality. Used in fabrication, vehicle body, electrical panels, and general manufacturing.',
    tags: ['ms', 'sheet', 'cold-rolled', 'plate'], inStock: false, stockQty: 0,
    isFeatured: false, avgRating: 4.2, reviewCount: 12,
    weightPerPiece: 49,
    specifications: [
      { key: 'Thickness', value: '2.0 mm' },
      { key: 'Dimensions', value: '2500 × 1250 mm' },
      { key: 'Standard', value: 'IS 513' },
      { key: 'Finish', value: 'Cold Rolled (CR)' },
      { key: 'Est. Weight', value: '49 kg / sheet' },
    ],
  },
  {
    _id: 'prod-008', slug: 'ms-round-bar-16mm', name: 'MS Round Bar 16mm',
    itemCode: 'STL-RND-16', storePrice: 2800, mrp: 3100, discount: 10,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: 'Solid mild steel round bar ideal for general engineering, machinery axes, transmission shafts, steel grille fabrication, and reinforcement ties.',
    tags: ['ms', 'round', 'bar', 'rod'], inStock: true, stockQty: 450,
    isFeatured: false, avgRating: 4.0, reviewCount: 28,
    weightPerPiece: 9.5,
    specifications: [
      { key: 'Diameter', value: '16 mm' },
      { key: 'Length', value: '6 meters' },
      { key: 'Standard', value: 'IS 2062' },
      { key: 'Process', value: 'Hot Rolled' },
      { key: 'Est. Weight', value: '9.5 kg / piece' },
    ],
  },
];

export async function mockFetchProducts(params?: {
  page?: number; limit?: number; search?: string;
  category?: string; featured?: boolean; sort?: string;
}): Promise<ProductListResponse> {
  await delay(700);

  let products = [...MOCK_PRODUCTS];

  if (params?.search) {
    const q = params.search.toLowerCase();
    products = products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }

  if (params?.category && params.category !== 'All') {
    products = products.filter((p) => p.category === params.category);
  }

  if (params?.featured) {
    products = products.filter((p) => p.isFeatured);
  }

  if (params?.sort === 'price_asc') products.sort((a, b) => a.storePrice - b.storePrice);
  else if (params?.sort === 'price_desc') products.sort((a, b) => b.storePrice - a.storePrice);
  else if (params?.sort === 'popular') products.sort((a, b) => b.reviewCount - a.reviewCount);

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const start = (page - 1) * limit;
  const paged = products.slice(start, start + limit);

  return {
    products: paged,
    total: products.length,
    page,
    totalPages: Math.ceil(products.length / limit),
  };
}

export async function mockFetchProductBySlug(slug: string): Promise<StoreProduct> {
  await delay(400);
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
  if (!product) throw new Error('Product not found');

  // Add related products
  return {
    ...product,
    relatedProducts: MOCK_PRODUCTS.filter((p) => p._id !== product._id && p.category === product.category).slice(0, 4),
  };
}

export async function mockFetchCategories(): Promise<string[]> {
  await delay(300);
  return [...new Set(MOCK_PRODUCTS.map((p) => p.category))];
}

// ──────────────────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
