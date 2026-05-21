import type { GenerateParams, ProviderConfig } from "@super-image/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_PARAMS: GenerateParams = {
  model: "gpt-image-1",
  size: "1024x1024",
  quality: "auto",
  n: 1,
};

export interface SettingsState {
  providers: Record<string, ProviderConfig>;
  activeProviderId: string;

  // Getters
  getActiveProvider: () => ProviderConfig | undefined;

  // Actions
  setProvider: (config: ProviderConfig) => void;
  removeProvider: (id: string) => void;
  setActiveProviderId: (id: string) => void;
  updateProviderField: (
    id: string,
    field: keyof ProviderConfig,
    value: string | GenerateParams,
  ) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      providers: {
        openai: {
          id: "openai",
          apiKey: "",
          baseUrl: "https://api.openai.com/v1",
          defaultModel: "gpt-image-1",
          defaultParams: DEFAULT_PARAMS,
        },
      },
      activeProviderId: "openai",

      getActiveProvider: () => {
        const state = get();
        return state.providers[state.activeProviderId];
      },

      setProvider: (config) =>
        set((state) => ({
          providers: { ...state.providers, [config.id]: config },
        })),

      removeProvider: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.providers;
          return { providers: rest };
        }),

      setActiveProviderId: (id) => set({ activeProviderId: id }),

      updateProviderField: (id, field, value) =>
        set((state) => {
          const provider = state.providers[id];
          if (!provider) return state;
          return {
            providers: {
              ...state.providers,
              [id]: { ...provider, [field]: value },
            },
          };
        }),
    }),
    {
      name: "super-image-settings",
      partialize: (state) => ({
        providers: state.providers,
        activeProviderId: state.activeProviderId,
      }),
    },
  ),
);
