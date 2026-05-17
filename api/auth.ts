import client from './client';

export interface ShopUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface AuthResponse {
  token: string;
  user: ShopUser;
}

const DUMMY_USER: ShopUser = {
  _id: 'mock_user_123',
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const loginAPI = async (email: string, password: string): Promise<AuthResponse> => {
  await delay(1000); // Simulate network latency
  // Accept any login for testing
  return {
    token: 'mock_jwt_token_123',
    user: { ...DUMMY_USER, email },
  };
};

export const registerAPI = async (payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResponse> => {
  await delay(1000);
  return {
    token: 'mock_jwt_token_123',
    user: { ...DUMMY_USER, ...payload },
  };
};

export const forgotPasswordAPI = async (email: string) => {
  await delay(1000);
  return { success: true, message: 'OTP sent to email' };
};

export const verifyOtpAPI = async (email: string, otp: string) => {
  await delay(1000);
  return { success: true, message: 'OTP verified successfully' };
};

export const getProfileAPI = async (token?: string): Promise<ShopUser> => {
  await delay(500);
  return DUMMY_USER;
};

export const updateProfileAPI = async (payload: Partial<ShopUser>) => {
  await delay(1000);
  return { success: true, user: { ...DUMMY_USER, ...payload } };
};
