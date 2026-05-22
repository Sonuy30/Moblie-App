import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const STORE_TOKEN = process.env.EXPO_PUBLIC_STORE_TOKEN || 'AITS_STR_PNK8472XQ';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://aitserp-30072025.vercel.app',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Store-Token': STORE_TOKEN,
  },
});

// Add JWT when user is logged in
client.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('aits_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('SecureStore item retrieval failed:', e);
  }
  return config;
});

// Handle expired token — only clear stored credentials, do NOT redirect.
// Each screen/hook handles navigation on its own. Redirecting here caused
// product detail pages to go back to home whenever the backend returned 401
// for unauthenticated requests.
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('aits_auth_token');
        await SecureStore.deleteItemAsync('aits_auth_user');
      } catch (e) {
        console.warn('SecureStore delete failed:', e);
      }
      // NOTE: Do NOT call router.replace here — it triggers on product/API
      // calls and sends the user back to the home tab unexpectedly.
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
    if (e.response?.data?.message) return e.response.data.message;
    if (e.response?.data?.error) return e.response.data.error;
    if (e.message) return e.message;
  }
  return 'Something went wrong. Please try again.';
};
