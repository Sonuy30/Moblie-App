/**
 * e2e/auth.test.ts
 *
 * Tier 1 & 2 E2E Tests: Authentications/onboarding flows.
 * Verifies OTP request/verification, registration constraints, credentials login,
 * profile fetching and updating, forgot password, invite validation, and password modification.
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

import {
  requestOTP,
  verifyOTP,
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPasswordAPI,
  validateInviteToken,
  changePassword,
} from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('E2E Authentication & Onboarding Flows', () => {
  beforeEach(async () => {
    await useAuthStore.getState().logout();
    jest.clearAllMocks();
  });

  // Test 1: OTP Request
  it('should successfully request OTP for a valid phone number', async () => {
    const res = await requestOTP('9876543210');
    expect(res).toBeDefined();
    expect(res.message).toContain('OTP sent');
    expect(res.maskedPhone).toContain('98');
  });

  // Test 2: OTP Verification
  it('should successfully verify OTP and log in a user', async () => {
    const phone = '9876543211';
    const otpRes = await requestOTP(phone);
    const devOtp = otpRes.devOtp;
    expect(devOtp).toBeDefined();

    const verifyRes = await verifyOTP(phone, devOtp!);
    expect(verifyRes.token).toBeDefined();
    expect(verifyRes.user).toBeDefined();
    expect(verifyRes.user?.phone).toBe(phone);
  });

  // Test 3: Invalid OTP
  it('should handle invalid OTP verification failure', async () => {
    const phone = '9876543212';
    await requestOTP(phone);
    await expect(verifyOTP(phone, '000000')).rejects.toThrow();
  });

  // Test 4: Register User
  it('should successfully register a new user', async () => {
    const phone = '9876543213';
    const regRes = await registerUser({
      fullName: 'New Customer',
      phone,
      password: 'password123',
    });
    expect(regRes.phone).toBe(phone);
    expect(regRes.devOtp).toBeDefined();

    // Verify OTP to complete flow and check session
    const verifyRes = await verifyOTP(phone, regRes.devOtp!);
    expect(verifyRes.user?.fullName).toBe('New Customer');
  });

  // Test 5: Register Existing User
  it('should prevent registration of an already registered phone number', async () => {
    const phone = '9876543214';
    await registerUser({
      fullName: 'Original User',
      phone,
      password: 'password123',
    });

    await expect(
      registerUser({
        fullName: 'Duplicate User',
        phone,
        password: 'password123',
      })
    ).rejects.toThrow();
  });

  // Test 6: Password Login
  it('should successfully log in with phone and password', async () => {
    const phone = '9876543215';
    await registerUser({
      fullName: 'Password User',
      phone,
      password: 'mypassword',
    });

    const loginRes = await loginUser({
      phone,
      password: 'mypassword',
    });
    expect(loginRes.authToken).toBeDefined();
    expect(loginRes.user.fullName).toBe('Password User');
  });

  // Test 7: Password Login Incorrect Credentials
  it('should fail password login with incorrect credentials', async () => {
    const phone = '9876543216';
    await registerUser({
      fullName: 'Password User 2',
      phone,
      password: 'correctpassword',
    });

    await expect(
      loginUser({
        phone,
        password: 'incorrectpassword',
      })
    ).rejects.toThrow();
  });

  // Test 8: Get Profile
  it('should get profile data for authenticated user', async () => {
    const phone = '9876543217';
    const mockUser = {
      phone,
      password: 'password123',
      profile: {
        _id: 'demo-user-001',
        fullName: 'Profile User',
        phone,
        role: 'customer' as const,
        companyId: 'AITS_COMP_001',
        companyName: 'Test Company',
      }
    };
    await AsyncStorage.setItem('aits_mock_registered_users', JSON.stringify([mockUser]));

    const reg = await loginUser({
      phone,
      password: 'password123',
    });

    await useAuthStore.getState().setSession(reg.authToken, reg.user);

    const profileRes = await getProfile();
    expect(profileRes.user).toBeDefined();
    expect(profileRes.user.phone).toBe(phone);
  });

  // Test 9: Update Profile
  it('should update profile data successfully', async () => {
    const phone = '9876543218';
    const reg = await registerUser({
      fullName: 'Profile User 2',
      phone,
      password: 'password123',
    });

    const verify = await verifyOTP(phone, (reg as any).devOtp);
    await useAuthStore.getState().setSession(verify.token, verify.user!);

    const updateRes = await updateProfile({ fullName: 'Updated Profile User' });
    expect(updateRes.success).toBe(true);
  });

  // Test 10: Forgot Password
  it('should trigger forgot password and mock success response', async () => {
    const res = await forgotPasswordAPI('test@aits.com');
    expect(res.message).toContain('reset link has been sent');
  });

  // Test 11: Validate Invite Token
  it('should validate client token invite flow', async () => {
    const res = await validateInviteToken('token-123');
    expect(res.customerId).toBeDefined();
    expect(res.companyName).toBeDefined();
  });

  // Test 12: Change Password
  it('should successfully change password', async () => {
    const res = await changePassword({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword',
    });
    expect(res.message).toContain('successfully');
  });
});
