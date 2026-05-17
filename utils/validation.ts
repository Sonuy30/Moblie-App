import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .min(10, 'Enter a valid 10-digit number')
    .max(10, 'Enter a valid 10-digit number')
    .regex(/^\d+$/, 'Only digits allowed'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

export const otpSchema = z.object({
  otp: z.string().min(4, 'Enter OTP').max(6, 'Enter valid OTP'),
});

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Enter valid phone').max(10, 'Enter valid phone'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Enter valid pincode').max(6, 'Enter valid pincode'),
});

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Select a rating').max(5),
  title: z.string().optional(),
  comment: z.string().min(20, 'Review must be at least 20 characters'),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type AddressForm = z.infer<typeof addressSchema>;
export type ReviewForm = z.infer<typeof reviewSchema>;
