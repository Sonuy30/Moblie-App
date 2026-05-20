import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_BASE_URL = 'https://aitserp-30072025.vercel.app';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('store_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (expired token) — redirect to onboarding
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('store_token');
      await SecureStore.deleteItemAsync('aits_auth_user');
      router.replace('/(onboarding)/welcome');
    }
    return Promise.reject(error);
  }
);

export default client;

// Utility to extract a user-friendly error message from Axios errors
export const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const e = err as any;
    // Axios error with backend message
    if (e.response?.data?.message) return e.response.data.message;
    if (e.response?.data?.error) return e.response.data.error;
    // Standard Error
    if (e.message) return e.message;
  }
  return 'Something went wrong. Please try again.';
};
