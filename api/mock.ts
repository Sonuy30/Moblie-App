import type { AuthUser } from '@/stores/authStore';
import type { StoreProduct, ProductListResponse, ProductVariant } from './products';
import AsyncStorage from '@react-native-async-storage/async-storage';

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

// ──────────────────────────────────────────────────────────
// Demo users store (in-memory for session)
// ──────────────────────────────────────────────────────────
interface MockUser {
  phone: string;
  password: string;
  profile: AuthUser;
}

const MOCK_USERS: MockUser[] = [];

const OTP_STORE: Record<string, { otp: string; expiry: number; phone: string }> = {};

const REGISTERED_USERS_KEY = 'aits_mock_registered_users';

async function getRegisteredUsers(): Promise<MockUser[]> {
  try {
    const data = await AsyncStorage.getItem(REGISTERED_USERS_KEY);
    return data ? (JSON.parse(data) as MockUser[]) : [];
  } catch {
    return [];
  }
}

async function saveRegisteredUsers(users: MockUser[]): Promise<void> {
  try {
    await AsyncStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('[MOCK] Failed to save mock registered users:', err);
  }
}

async function findUser(phone: string): Promise<MockUser | undefined> {
  const registered = await getRegisteredUsers();
  return (
    MOCK_USERS.find((u) => u.phone === phone) ||
    registered.find((u) => u.phone === phone)
  );
}

function generateMockJWT(user: AuthUser): string {
  const payload = btoa(JSON.stringify({ sub: user._id, phone: user.phone, iat: Date.now() }));
  return `mock.${payload}.sig`;
}

// ──────────────────────────────────────────────────────────
// Mock Auth functions
// ──────────────────────────────────────────────────────────

export async function mockRequestOTP(phone: string): Promise<{ message: string; companyName: string; maskedPhone: string; devOtp: string }> {
  await delay(600);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  OTP_STORE[phone] = { otp, expiry: Date.now() + 5 * 60 * 1000, phone };
  console.info(`[MOCK] OTP for ${phone}: ${otp}`);
  return {
    message: 'OTP sent successfully',
    companyName: companyName,
    maskedPhone: `+91 ${phone.slice(0, 2)}****${phone.slice(-2)}`,
    devOtp: otp,
  };
}

export async function mockVerifyOTP(phone: string, otp: string): Promise<{ token: string; authToken: string; user: AuthUser; customer: AuthUser }> {
  await delay(800);
  const stored = OTP_STORE[phone];
  if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
    throw new Error('Invalid or expired OTP. Please request a new one.');
  }
  delete OTP_STORE[phone];
  let user = await findUser(phone);
  if (!user) {
    const newUser: MockUser = {
      phone,
      password: '',
      profile: {
        _id: `user-${Date.now()}`,
        fullName: `Customer ${phone.slice(-4)}`,
        phone,
        role: 'customer',
        companyId: 'AITS_COMP_001',
        companyName: companyName,
        tier: 'regular',
        creditLimit: 10000,
        creditAvailable: 10000,
      },
    };
    const registered = await getRegisteredUsers();
    registered.push(newUser);
    await saveRegisteredUsers(registered);
    user = newUser;
  }
  const token = generateMockJWT(user.profile);
  return { token, authToken: token, user: user.profile, customer: user.profile };
}

export async function mockRegisterUser(params: { fullName: string; phone: string; password?: string }): Promise<{ message: string; phone: string; devOtp: string }> {
  await delay(700);
  const existing = await findUser(params.phone);
  if (existing) {
    throw new Error('Phone number already registered. Please login instead.');
  }
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  console.info(`[MOCK] Register OTP for ${params.phone}: ${otp}`);
  const pending: MockUser = {
    phone: params.phone,
    password: params.password || '',
    profile: {
      _id: `user-${Date.now()}`,
      fullName: params.fullName,
      phone: params.phone,
      role: 'customer',
      companyId: 'AITS_COMP_001',
      companyName: companyName,
      tier: 'regular',
      creditLimit: 10000,
      creditAvailable: 10000,
    },
  };
  const registered = await getRegisteredUsers();
  registered.push(pending);
  await saveRegisteredUsers(registered);
  OTP_STORE[params.phone] = { otp, expiry: Date.now() + 5 * 60 * 1000, phone: params.phone };
  return { message: 'OTP sent to your mobile number', phone: params.phone, devOtp: otp };
}

export async function mockLoginUser(params: { phone: string; password?: string }): Promise<{ authToken: string; user: AuthUser }> {
  await delay(800);
  const user = await findUser(params.phone);
  if (!user) throw new Error('No account found with this phone number. Please register first.');
  if (user.password && params.password && user.password !== params.password) {
    throw new Error('Incorrect password. Please try again.');
  }
  const token = generateMockJWT(user.profile);
  return { authToken: token, user: user.profile };
}

export async function mockGetProfile(userId: string): Promise<{ user: AuthUser }> {
  await delay(300);
  const registered = await getRegisteredUsers();
  const user =
    MOCK_USERS.find((u) => u.profile._id === userId) ||
    registered.find((u) => u.profile._id === userId);
  if (!user) throw new Error('User not found');
  return { user: user.profile };
}

// ──────────────────────────────────────────────────────────
// Helper to build variants for TMT bars by diameter
// ──────────────────────────────────────────────────────────
function makeTMTVariants(): ProductVariant[] {
  const sizes = [
    { dia: '8mm',  price: 480,  mrp: 530,  weight: 3.7,  stockQty: 2000, itemCode: 'TMT-08-500' },
    { dia: '10mm', price: 650,  mrp: 720,  weight: 7.4,  stockQty: 1500, itemCode: 'TMT-10-500' },
    { dia: '12mm', price: 780,  mrp: 860,  weight: 10.7, stockQty: 1200, itemCode: 'TMT-12-500' },
    { dia: '16mm', price: 1050, mrp: 1150, weight: 18.9, stockQty: 900,  itemCode: 'TMT-16-500' },
    { dia: '20mm', price: 1650, mrp: 1800, weight: 29.6, stockQty: 600,  itemCode: 'TMT-20-500' },
    { dia: '25mm', price: 2580, mrp: 2800, weight: 46.2, stockQty: 400,  itemCode: 'TMT-25-500' },
    { dia: '32mm', price: 4200, mrp: 4600, weight: 75.4, stockQty: 0,    itemCode: 'TMT-32-500' },
  ];
  return sizes.map((s) => ({
    _id: `var-tmt-${s.dia}`,
    label: s.dia,
    storePrice: s.price,
    mrp: s.mrp,
    discount: Math.round((1 - s.price / s.mrp) * 100),
    stockQty: s.stockQty,
    inStock: s.stockQty > 0,
    weightPerPiece: s.weight,
    itemCode: s.itemCode,
    specifications: [
      { key: 'Diameter', value: s.dia },
      { key: 'Est. Weight (12m)', value: `${s.weight} kg / piece` },
      { key: 'Grade', value: 'Fe 500D (IS 1786)' },
      { key: 'UTS/YS Ratio', value: '≥ 1.25' },
    ],
  }));
}

function makeAngleBarVariants(): ProductVariant[] {
  const sizes = [
    { size: '25×25 mm', price: 2100, mrp: 2300, weight: 8.7,  stockQty: 300, code: 'STL-ANG-2525' },
    { size: '40×40 mm', price: 4800, mrp: 5200, weight: 21,   stockQty: 240, code: 'STL-ANG-4040' },
    { size: '50×50 mm', price: 5800, mrp: 6300, weight: 28.5, stockQty: 180, code: 'STL-ANG-5050' },
    { size: '65×65 mm', price: 7500, mrp: 8200, weight: 37.4, stockQty: 120, code: 'STL-ANG-6565' },
    { size: '75×75 mm', price: 9200, mrp: 9900, weight: 52,   stockQty: 80,  code: 'STL-ANG-7575' },
    { size: '90×90 mm', price: 12500, mrp: 13500, weight: 77, stockQty: 0,   code: 'STL-ANG-9090' },
  ];
  return sizes.map((s) => ({
    _id: `var-ang-${s.code}`,
    label: s.size,
    storePrice: s.price,
    mrp: s.mrp,
    discount: Math.round((1 - s.price / s.mrp) * 100),
    stockQty: s.stockQty,
    inStock: s.stockQty > 0,
    weightPerPiece: s.weight,
    itemCode: s.code,
    specifications: [
      { key: 'Size', value: s.size },
      { key: 'Est. Weight (6m)', value: `${s.weight} kg / piece` },
      { key: 'Material', value: 'Mild Steel (IS 2062)' },
      { key: 'Grade', value: 'E250' },
    ],
  }));
}

function makeGIPipeVariants(): ProductVariant[] {
  const sizes = [
    { dia: '15mm (½")',  price: 240,  mrp: 270,  weight: 6.5,  stockQty: 600, code: 'PIPE-GI-15L' },
    { dia: '20mm (¾")',  price: 320,  mrp: 360,  weight: 9,    stockQty: 500, code: 'PIPE-GI-20L' },
    { dia: '25mm (1")',  price: 420,  mrp: 470,  weight: 12.2, stockQty: 420, code: 'PIPE-GI-25L' },
    { dia: '32mm (1¼")', price: 580, mrp: 640,  weight: 16.8, stockQty: 300, code: 'PIPE-GI-32L' },
    { dia: '40mm (1½")', price: 720, mrp: 800,  weight: 20.4, stockQty: 200, code: 'PIPE-GI-40L' },
    { dia: '50mm (2")',  price: 980,  mrp: 1080, weight: 27.2, stockQty: 150, code: 'PIPE-GI-50L' },
    { dia: '65mm (2½")', price: 1380, mrp: 1500, weight: 36,  stockQty: 0,   code: 'PIPE-GI-65L' },
  ];
  return sizes.map((s) => ({
    _id: `var-gip-${s.code}`,
    label: s.dia,
    storePrice: s.price,
    mrp: s.mrp,
    discount: Math.round((1 - s.price / s.mrp) * 100),
    stockQty: s.stockQty,
    inStock: s.stockQty > 0,
    weightPerPiece: s.weight,
    itemCode: s.code,
    specifications: [
      { key: 'Diameter', value: s.dia },
      { key: 'Est. Weight (6m)', value: `${s.weight} kg / piece` },
      { key: 'Standard', value: 'IS 1239' },
      { key: 'Coating', value: 'Zinc Galvanized (Hot-Dip)' },
    ],
  }));
}

function makeRoundBarVariants(): ProductVariant[] {
  const sizes = [
    { dia: '8mm',  price: 850,  mrp: 940,  weight: 3.0,  stockQty: 600, code: 'STL-RND-08' },
    { dia: '10mm', price: 1100, mrp: 1200, weight: 4.7,  stockQty: 500, code: 'STL-RND-10' },
    { dia: '12mm', price: 1600, mrp: 1750, weight: 6.8,  stockQty: 480, code: 'STL-RND-12' },
    { dia: '16mm', price: 2800, mrp: 3100, weight: 9.5,  stockQty: 450, code: 'STL-RND-16' },
    { dia: '20mm', price: 4200, mrp: 4600, weight: 14.8, stockQty: 300, code: 'STL-RND-20' },
    { dia: '25mm', price: 6500, mrp: 7200, weight: 23.2, stockQty: 180, code: 'STL-RND-25' },
    { dia: '32mm', price: 10800, mrp: 11800, weight: 38, stockQty: 0,   code: 'STL-RND-32' },
  ];
  return sizes.map((s) => ({
    _id: `var-rnd-${s.code}`,
    label: s.dia,
    storePrice: s.price,
    mrp: s.mrp,
    discount: Math.round((1 - s.price / s.mrp) * 100),
    stockQty: s.stockQty,
    inStock: s.stockQty > 0,
    weightPerPiece: s.weight,
    itemCode: s.code,
    specifications: [
      { key: 'Diameter', value: s.dia },
      { key: 'Est. Weight (6m)', value: `${s.weight} kg / piece` },
      { key: 'Standard', value: 'IS 2062' },
      { key: 'Process', value: 'Hot Rolled' },
    ],
  }));
}

function makeMSSheetVariants(): ProductVariant[] {
  const thicknesses = [
    { t: '1mm',  price: 1800, mrp: 2000, weight: 24.5, stockQty: 200, code: 'STL-SHT-1MM' },
    { t: '1.5mm', price: 2700, mrp: 2950, weight: 36.8, stockQty: 180, code: 'STL-SHT-15MM' },
    { t: '2mm',  price: 3600, mrp: 3900, weight: 49,   stockQty: 0,   code: 'STL-SHT-2MM' },
    { t: '2.5mm', price: 4400, mrp: 4800, weight: 61.3, stockQty: 140, code: 'STL-SHT-25MM' },
    { t: '3mm',  price: 5300, mrp: 5800, weight: 73.5, stockQty: 100, code: 'STL-SHT-3MM' },
    { t: '4mm',  price: 7100, mrp: 7800, weight: 98,   stockQty: 80,  code: 'STL-SHT-4MM' },
    { t: '5mm',  price: 8900, mrp: 9700, weight: 122.5, stockQty: 60, code: 'STL-SHT-5MM' },
    { t: '6mm',  price: 10700, mrp: 11700, weight: 147, stockQty: 0,  code: 'STL-SHT-6MM' },
  ];
  return thicknesses.map((s) => ({
    _id: `var-sht-${s.code}`,
    label: s.t,
    storePrice: s.price,
    mrp: s.mrp,
    discount: Math.round((1 - s.price / s.mrp) * 100),
    stockQty: s.stockQty,
    inStock: s.stockQty > 0,
    weightPerPiece: s.weight,
    itemCode: s.code,
    specifications: [
      { key: 'Thickness', value: s.t },
      { key: 'Dimensions', value: '2500 × 1250 mm' },
      { key: 'Est. Weight', value: `${s.weight} kg / sheet` },
      { key: 'Standard', value: 'IS 513' },
      { key: 'Finish', value: 'Cold Rolled (CR)' },
    ],
  }));
}

// ──────────────────────────────────────────────────────────
// Mock Products with Variants
// ──────────────────────────────────────────────────────────
const MOCK_PRODUCTS: StoreProduct[] = [
  // ── 1. MS Angle Bar — multi-size variant ──
  {
    _id: 'prod-001',
    slug: 'ms-angle-bar',
    name: 'MS Angle Bar (L-Section)',
    itemCode: 'STL-ANG-4040',
    storePrice: 4800, mrp: 5200, discount: 8,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: `High-quality ${companyName} mild steel angle bar (L-section) for structural applications. Fabricated under IS 2062 standards with excellent mechanical strength and weldability. Ideal for construction, fabrication, and support frameworks. Available in multiple sizes — select your required dimension below.`,
    tags: ['ms', 'angle', 'structural'],
    inStock: true, stockQty: 240,
    isFeatured: true, avgRating: 4.5, reviewCount: 38,
    weightPerPiece: 21,
    variantType: 'Size',
    variants: makeAngleBarVariants(),
    specifications: [
      { key: 'Material', value: 'Mild Steel (IS 2062)' },
      { key: 'Length', value: '6 meters' },
      { key: 'Grade', value: 'E250' },
      { key: 'Process', value: 'Hot Rolled' },
      { key: 'Brand', value: companyName },
    ],
  },

  // ── 2. MS Channel ──
  {
    _id: 'prod-002',
    slug: 'ms-channel-100x50',
    name: 'MS Channel 100×50 mm',
    itemCode: 'STL-CHN-10050',
    storePrice: 7200, mrp: 7800, discount: 8,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: `Standard mild steel channel (C-section) designed for industrial construction, bridges, and heavy-duty frame building. Sourced directly from primary steel mills and quality-checked at ${companyName} warehouse.`,
    tags: ['ms', 'channel', 'structural'],
    inStock: true, stockQty: 180,
    isFeatured: true, avgRating: 4.3, reviewCount: 22,
    weightPerPiece: 57,
    specifications: [
      { key: 'Material', value: 'Mild Steel' },
      { key: 'Standard', value: 'IS 2062' },
      { key: 'Length', value: '6 meters' },
      { key: 'Size', value: '100 × 50 mm' },
      { key: 'Grade', value: 'E250 A' },
      { key: 'Est. Weight', value: '57 kg / piece' },
      { key: 'Brand', value: companyName },
    ],
  },

  // ── 3. GI Pipe — multi-diameter variant ──
  {
    _id: 'prod-003',
    slug: 'gi-pipe',
    name: 'GI Pipe (Light Grade, IS 1239)',
    itemCode: 'PIPE-GI-20L',
    storePrice: 320, mrp: 360, discount: 11,
    minOrderQty: 5, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Pipes & Tubes',
    description: 'Hot-dip galvanized iron pipe with superior corrosion resistance. Ideal for safe water supply networks, domestic plumbing, scaffolding, and irrigation systems. IS 1239 certified. Choose your diameter from the options below.',
    tags: ['gi', 'pipe', 'plumbing'],
    inStock: true, stockQty: 500,
    isFeatured: false, avgRating: 4.1, reviewCount: 45,
    weightPerPiece: 9,
    variantType: 'Diameter',
    variants: makeGIPipeVariants(),
    specifications: [
      { key: 'Standard', value: 'IS 1239' },
      { key: 'Length', value: '6 meters' },
      { key: 'Coating', value: 'Zinc Galvanized (Hot-Dip)' },
      { key: 'Grade', value: 'Light / Medium / Heavy' },
    ],
  },

  // ── 4. MS Flat Bar ──
  {
    _id: 'prod-004',
    slug: 'ms-flat-bar-50x5',
    name: 'MS Flat Bar 50×5 mm',
    itemCode: 'STL-FLT-5005',
    storePrice: 3200, mrp: 3500, discount: 9,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: 'Versatile mild steel flat bar for brackets, structural frameworks, supports, and fabrication. Hot-rolled with smooth finish. Used in gates, grilles, machine frames, and general engineering.',
    tags: ['ms', 'flat', 'bar'],
    inStock: true, stockQty: 320,
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

  // ── 5. TMT Bar Fe500D — multi-diameter variant ──
  {
    _id: 'prod-005',
    slug: 'tmt-bar-fe500d',
    name: 'TMT Bar Fe500D (IS 1786)',
    itemCode: 'TMT-10-500',
    storePrice: 650, mrp: 720, discount: 10,
    minOrderQty: 10, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'TMT Bars',
    description: `Thermo-Mechanically Treated high-strength reinforcement bars certified Fe500D. Superior seismic resistance, excellent ductility, and high tensile load management. Suitable for all RCC construction — residential slabs to commercial high-rises. Select diameter (8mm–32mm) below.`,
    tags: ['tmt', 'rebar', 'construction', 'fe500'],
    inStock: true, stockQty: 1500,
    isFeatured: true, avgRating: 4.7, reviewCount: 91,
    weightPerPiece: 7.4,
    variantType: 'Diameter',
    variants: makeTMTVariants(),
    specifications: [
      { key: 'Grade', value: 'Fe 500D (IS 1786)' },
      { key: 'Length', value: '12 meters' },
      { key: 'UTS/YS Ratio', value: '≥ 1.25' },
      { key: 'Elongation', value: '≥ 16%' },
      { key: 'Brand', value: companyName },
    ],
  },

  // ── 6. MS Sheet — multi-thickness variant ──
  {
    _id: 'prod-007',
    slug: 'ms-sheet',
    name: 'MS Sheet (Cold Rolled, IS 513)',
    itemCode: 'STL-SHT-2MM',
    storePrice: 3600, mrp: 3900, discount: 8,
    minOrderQty: 1, unit: 'sheet',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Sheets & Plates',
    description: 'Cold-rolled commercial grade mild steel sheet. Precise thickness profile, excellent flatness, and high surface finish quality. Used in fabrication, vehicle body panels, electrical enclosures, and general manufacturing. Select thickness (1mm–6mm) below.',
    tags: ['ms', 'sheet', 'cold-rolled', 'plate'],
    inStock: true, stockQty: 200,
    isFeatured: false, avgRating: 4.2, reviewCount: 12,
    weightPerPiece: 49,
    variantType: 'Thickness',
    variants: makeMSSheetVariants(),
    specifications: [
      { key: 'Dimensions', value: '2500 × 1250 mm' },
      { key: 'Standard', value: 'IS 513' },
      { key: 'Finish', value: 'Cold Rolled (CR)' },
      { key: 'Brand', value: companyName },
    ],
  },

  // ── 7. MS Round Bar — multi-diameter variant ──
  {
    _id: 'prod-008',
    slug: 'ms-round-bar',
    name: 'MS Round Bar (Hot Rolled)',
    itemCode: 'STL-RND-16',
    storePrice: 2800, mrp: 3100, discount: 10,
    minOrderQty: 1, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Structural Steel',
    description: 'Solid mild steel round bar ideal for general engineering, machinery axes, transmission shafts, steel grille fabrication, and reinforcement ties. Hot-rolled IS 2062. Available in diameters from 8mm to 32mm.',
    tags: ['ms', 'round', 'bar', 'rod'],
    inStock: true, stockQty: 450,
    isFeatured: false, avgRating: 4.0, reviewCount: 28,
    weightPerPiece: 9.5,
    variantType: 'Diameter',
    variants: makeRoundBarVariants(),
    specifications: [
      { key: 'Length', value: '6 meters' },
      { key: 'Standard', value: 'IS 2062' },
      { key: 'Process', value: 'Hot Rolled' },
      { key: 'Brand', value: companyName },
    ],
  },

  // ── 8. Binding Wire ──
  {
    _id: 'prod-009',
    slug: 'binding-wire-18g',
    name: 'Binding Wire 18 Gauge (Annealed)',
    itemCode: 'WIR-BND-18G',
    storePrice: 1200, mrp: 1350, discount: 11,
    minOrderQty: 1, unit: 'coil (25 kg)',
    images: [
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'Wires & Fasteners',
    description: 'Annealed black binding wire for tying TMT bars in RCC construction. Soft, flexible, and easy to bend. Each coil weighs ~25 kg. Widely used on construction sites for rebar tying.',
    tags: ['wire', 'binding', 'construction'],
    inStock: true, stockQty: 300,
    isFeatured: false, avgRating: 4.3, reviewCount: 55,
    weightPerPiece: 25,
    specifications: [
      { key: 'Gauge', value: '18 SWG (1.2mm)' },
      { key: 'Type', value: 'Annealed (Black)' },
      { key: 'Coil Weight', value: '~25 kg' },
      { key: 'Standard', value: 'IS 280' },
    ],
  },

  // ── 9. Tor Steel (Fe415) ──
  {
    _id: 'prod-010',
    slug: 'tor-steel-fe415',
    name: 'Tor Steel Fe415 Reinforcement Bar',
    itemCode: 'TOR-FE415-12',
    storePrice: 720, mrp: 790, discount: 9,
    minOrderQty: 10, unit: 'piece',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'TMT Bars',
    description: 'Tor steel deformed bar (Fe415 grade, IS 1786) for moderate structural applications. Good weldability, suitable for residential construction where Fe500D is not mandatory.',
    tags: ['tor', 'rebar', 'fe415'],
    inStock: true, stockQty: 800,
    isFeatured: false, avgRating: 4.1, reviewCount: 34,
    weightPerPiece: 10.7,
    specifications: [
      { key: 'Grade', value: 'Fe 415 (IS 1786)' },
      { key: 'Diameter', value: '12 mm' },
      { key: 'Length', value: '12 meters' },
      { key: 'Est. Weight', value: '10.7 kg / piece' },
    ],
  },
];

// ──────────────────────────────────────────────────────────
// Mock product fetcher functions
// ──────────────────────────────────────────────────────────

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

  // Exact match first (by slug or _id)
  let product = MOCK_PRODUCTS.find((p) => p.slug === slug || p._id === slug);

  // Partial match (handles old slugs that included variant size like "tmt-bar-12mm")
  if (!product) {
    product = MOCK_PRODUCTS.find((p) =>
      slug.startsWith(p.slug) || p.slug.startsWith(slug.replace(/-\d+mm$/, '').replace(/-\d+x\d+mm$/, ''))
    );
  }

  // Last resort: return the first product rather than crashing
  if (!product) {
    console.warn(`[MOCK] Product slug "${slug}" not found — returning first product as fallback`);
    product = MOCK_PRODUCTS[0];
  }

  return {
    ...product,
    relatedProducts: MOCK_PRODUCTS
      .filter((p) => p._id !== product._id && p.category === product.category)
      .slice(0, 4),
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
