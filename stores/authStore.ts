import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { loginAPI, registerAPI, getProfileAPI, updateProfileAPI, ShopUser } from '@/api/auth';

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthStore {
  user: ShopUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateProfile: (data: Partial<ShopUser>) => void;
  setUser: (user: ShopUser) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await loginAPI(email, password);
    const token = response.token;
    const user = response.user;
    await SecureStore.setItemAsync('shop_token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (data) => {
    const response = await registerAPI(data);
    const token = response.token;
    const user = response.user;
    await SecureStore.setItemAsync('shop_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('shop_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('shop_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const user = await getProfileAPI(token);
      set({ user, token, isAuthenticated: true });
    } catch {
      await SecureStore.deleteItemAsync('shop_token');
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: (data) =>
    set((s) => ({
      user: s.user ? { ...s.user, ...data } : null,
    })),

  setUser: (user) => set({ user }),
}));
