import type {
  ConnectionStatus,
  GenerateParams,
  ProviderConfig,
} from "@super-image/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { PROVIDER_TYPES } from "@/lib/providers/provider-types";

const DEFAULT_PARAMS: GenerateParams = {
  model: "gpt-image-1",
  size: "1024x1024",
  quality: "auto",
  n: 1,
};

function makeDefaultProvider(): ProviderConfig {
  return {
    id: "openai",
    providerType: "openai",
    displayName: "OpenAI",
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-image-1",
    defaultParams: DEFAULT_PARAMS,
    connectionStatus: "unknown",
  };
}

/** Migrate v1 (no providerType/displayName/connectionStatus) → v2 */
function migrateV1(persisted: Record<string, unknown>): Record<string, unknown> {
  const providers = persisted.providers as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!providers) return persisted;

  const migrated: Record<string, ProviderConfig> = {};
  for (const [key, p] of Object.entries(providers)) {
    migrated[key] = {
      id: (p.id as string) ?? key,
      providerType: (p.providerType as string) ?? key,
      displayName: (p.displayName as string) ?? key,
      apiKey: (p.apiKey as string) ?? "",
      baseUrl: (p.baseUrl as string) ?? "https://api.openai.com/v1",
      defaultModel: (p.defaultModel as string) ?? "gpt-image-1",
      defaultParams: (p.defaultParams as GenerateParams) ?? DEFAULT_PARAMS,
      connectionStatus: (p.connectionStatus as ConnectionStatus) ?? "unknown",
      connectionError: p.connectionError as string | undefined,
    };
  }
  return { ...persisted, providers: migrated };
}

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
    value: string | GenerateParams | ConnectionStatus,
  ) => void;
  addProvider: (providerType: string, displayName: string) => string;
  updateConnectionStatus: (
    id: string,
    status: ConnectionStatus,
    error?: string,
  ) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      providers: {
        openai: makeDefaultProvider(),
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
          const nextActive =
            state.activeProviderId === id
              ? Object.keys(rest)[0] ?? ""
              : state.activeProviderId;
          return { providers: rest, activeProviderId: nextActive };
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

      addProvider: (providerType, displayName) => {
        const id = crypto.randomUUID();
        const meta = PROVIDER_TYPES.find((t) => t.type === providerType);
        const config: ProviderConfig = {
          id,
          providerType,
          displayName,
          apiKey: "",
          baseUrl: meta?.defaultBaseUrl ?? "https://api.openai.com/v1",
          defaultModel: meta?.defaultModel ?? "gpt-image-1",
          defaultParams: DEFAULT_PARAMS,
          connectionStatus: "unknown",
        };
        set((state) => ({
          providers: { ...state.providers, [id]: config },
        }));
        return id;
      },

      updateConnectionStatus: (id, status, error) =>
        set((state) => {
          const provider = state.providers[id];
          if (!provider) return state;
          return {
            providers: {
              ...state.providers,
              [id]: {
                ...provider,
                connectionStatus: status,
                connectionError: error,
              },
            },
          };
        }),
    }),
    {
      name: "super-image-settings",
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) {
          return migrateV1(persisted as Record<string, unknown>) as unknown as SettingsState;
        }
        return persisted as unknown as SettingsState;
      },
      partialize: (state) => ({
        providers: state.providers,
        activeProviderId: state.activeProviderId,
      }),
    },
  ),
);
