import { create } from "zustand";

export interface UIState {
  sidebarOpen: boolean;
  settingsPanelOpen: boolean;
  guideOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSettingsPanel: () => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setGuideOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  settingsPanelOpen: false,
  guideOpen: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSettingsPanel: () =>
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),

  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),

  setGuideOpen: (open) => set({ guideOpen: open }),
}));
