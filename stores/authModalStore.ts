import { create } from 'zustand';

interface AuthModalStore {
  isVisible: boolean;
  pendingAction: 'cart' | 'checkout' | 'wishlist' | 'account' | null;
  pendingData: any; // Dynamic data for completing the action (like product details)
  show: (action: AuthModalStore['pendingAction'], data?: any) => void;
  hide: () => void;
}

export const useAuthModalStore = create<AuthModalStore>((set) => ({
  isVisible: false,
  pendingAction: null,
  pendingData: null,
  show: (action, data = null) => set({ isVisible: true, pendingAction: action, pendingData: data }),
  hide: () => set({ isVisible: false, pendingAction: null, pendingData: null }),
}));
