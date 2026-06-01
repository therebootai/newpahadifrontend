import { create } from 'zustand';

interface SidebarState {
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isMobileOpen: false,
  setMobileOpen: (isOpen) => set({ isMobileOpen: isOpen }),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
}));
