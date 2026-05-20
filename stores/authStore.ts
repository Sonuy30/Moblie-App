import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getProfile } from '@/api/auth';

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
        // Instantly authenticate with cached data to avoid visual jumps
        set({ token, user, isAuthenticated: true, isLoading: false });

        // Synchronize dynamic claims (creditAvailable, tier, pricingGroup) in the background
        try {
          const profileResponse = await getProfile();
          if (profileResponse?.user) {
            const updatedUser = { ...user, ...profileResponse.user };
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
            set({ user: updatedUser });
          }
        } catch (syncError) {
          // Quietly log sync error, allowing the user to continue offline/with cached data
          console.warn('Dynamic claims background sync failed:', syncError);
        }
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Session restore failed:', e);
      set({ isLoading: false });
    }
  },

  updatePushToken: (pushToken) =>
    set(s => ({ user: s.user ? { ...s.user, pushToken } : null })),
}));

