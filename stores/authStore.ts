import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
  _id: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'delivery_staff' | 'warehouse_staff' | 'admin';
  companyId: string;
  companyName: string;
  tier?: 'premium' | 'regular' | 'guest';
  creditLimit?: number;
  creditAvailable?: number;
  pushToken?: string;
  email?: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setSession: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updatePushToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: async (token, user) => {
    await SecureStore.setItemAsync('aits_auth_token', token);
    await SecureStore.setItemAsync('aits_auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('aits_auth_token');
    await SecureStore.deleteItemAsync('aits_auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('aits_auth_token');
      const userStr = await SecureStore.getItemAsync('aits_auth_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch (e) {
      console.warn('Restore session error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  updatePushToken: (token: string) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, pushToken: token } : null;
      if (updatedUser) {
        SecureStore.setItemAsync('aits_auth_user', JSON.stringify(updatedUser)).catch(e => {
          console.warn('Failed to persist user push token in SecureStore:', e);
        });
      }
      return { user: updatedUser };
    });
  },
}));
