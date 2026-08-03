import type { AuthUser } from '@/stores/authStore';
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

const MOCK_USERS: MockUser[] = [
  {
    phone: '9876543210',
    password: 'password123',
    profile: {
      _id: 'mock-cust-001',
      fullName: 'John Customer',
      phone: '9876543210',
      role: 'customer',
      companyId: 'AITS_COMP_001',
      companyName: companyName,
      tier: 'regular',
      creditLimit: 10000,
      creditAvailable: 10000,
    }
  },
  {
    phone: '9999999999',
    password: 'adminpassword',
    profile: {
      _id: 'mock-admin-001',
      fullName: 'Store Admin Staff',
      phone: '9999999999',
      role: 'admin',
      companyId: 'AITS_COMP_001',
      companyName: companyName,
      tier: 'regular',
      creditLimit: 0,
      creditAvailable: 0,
    }
  }
];

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
  // ⚠️ Privacy: never log the OTP itself; mask the phone number
  if (__DEV__) console.info(`[MOCK] OTP generated for ${phone.slice(0, 3)}***${phone.slice(-2)} (check devOtp field in response)`);
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
  // ⚠️ Privacy: never log the OTP itself; mask the phone number
  if (__DEV__) console.info(`[MOCK] Register OTP generated for ${params.phone.slice(0, 3)}***${params.phone.slice(-2)} (check devOtp field in response)`);
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
// Utility
// ──────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
