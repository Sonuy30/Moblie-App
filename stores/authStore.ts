import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  role?: 'customer' | 'delivery_staff' | 'warehouse_staff' | 'admin';
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
  pushToken?: string;

  // Customer identity and ERP details from JWT
  customerToken?: string; // CT-XXXXXX
  tier?: 'standard' | 'regular' | 'premium';
  pricingGroup?: string;
  creditLimit?: number;
  creditAvailable?: number;
  isPriority?: boolean;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setSession: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updatePushToken: (pushToken: string) => void;
}

const TOKEN_KEY = 'store_token';
const USER_KEY  = 'aits_auth_user';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ token, user, isAuthenticated: true });
      }
    } catch (e) {
      console.error('Session restore failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  updatePushToken: (pushToken) =>
    set(s => ({ user: s.user ? { ...s.user, pushToken } : null })),
}));
