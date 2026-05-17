import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/config';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('shop_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore not available (web), skip
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (token expired)
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('shop_token');
      } catch {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export default client;

// Helper to extract error message from API response
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};
