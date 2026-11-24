import type {
  ConnectionStatus,
  GenerateParams,
  Model,
  ProviderConfig,
} from "@super-image/utils";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { PROVIDER_TYPES } from "@/lib/providers/provider-types";

const DEFAULT_PARAMS: GenerateParams = {
  model: "gpt-image-2",
  size: "1024x1024",
  quality: "auto",
  n: 1,
  complexity: "auto",
  outputFormat: "png",
  frameCount: 9,
  frameDurationMs: 200,
  transparent: false,
  moderation: "auto",
};

function makeDefaultProvider(): ProviderConfig {
  return {
    id: "openai",
    providerType: "openai",
    displayName: "OpenAI",
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    defaultParams: DEFAULT_PARAMS,
    connectionStatus: "unknown",
  };
}

/** Migrate v1 (no providerType/displayName/connectionStatus) → v2 */
function migrateV1(
  persisted: Record<string, unknown>,
): Record<string, unknown> {
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
      defaultParams: (p.defaultParams as GenerateParams) ?? DEFAULT_PARAMS,
      connectionStatus: (p.connectionStatus as ConnectionStatus) ?? "unknown",
      connectionError: p.connectionError as string | undefined,
    };
  }
  return { ...persisted, providers: migrated };
}

/**
 * Migrate v2 → v3: 模型选择从服务商配置搬到生成参数。
 * 旧数据里的 defaultModel 折进 defaultParams.model，避免用户已选的模型被重置。
 */
export function migrateV2(
  persisted: Record<string, unknown>,
): Record<string, unknown> {
  const providers = persisted.providers as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!providers) return persisted;

  const migrated: Record<string, ProviderConfig> = {};
  for (const [key, p] of Object.entries(providers)) {
    const params = (p.defaultParams as GenerateParams) ?? DEFAULT_PARAMS;
    const legacyModel = p.defaultModel as string | undefined;
    migrated[key] = {
      id: (p.id as string) ?? key,
      providerType: (p.providerType as string) ?? key,
      displayName: (p.displayName as string) ?? key,
      apiKey: (p.apiKey as string) ?? "",
      baseUrl: (p.baseUrl as string) ?? "https://api.openai.com/v1",
      defaultParams: {
        ...DEFAULT_PARAMS,
        ...params,
        model: legacyModel ?? params.model ?? DEFAULT_PARAMS.model,
      },
      availableModels: p.availableModels as ProviderConfig["availableModels"],
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
    value: string | GenerateParams | ConnectionStatus | Model[],
  ) => void;
  setAvailableModels: (id: string, models: Model[]) => void;
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
              ? (Object.keys(rest)[0] ?? "")
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

      setAvailableModels: (id, models) =>
        set((state) => {
          const provider = state.providers[id];
          if (!provider) return state;
          return {
            providers: {
              ...state.providers,
              [id]: { ...provider, availableModels: models },
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
          defaultParams: {
            ...DEFAULT_PARAMS,
            model: meta?.defaultModel ?? DEFAULT_PARAMS.model,
          },
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
      version: 3,
      migrate: (persisted, version) => {
        let next = persisted as Record<string, unknown>;
        if (version < 2) {
          next = migrateV1(next);
        }
        if (version < 3) {
          next = migrateV2(next);
        }
        return next as unknown as SettingsState;
      },
      partialize: (state) => ({
        providers: state.providers,
        activeProviderId: state.activeProviderId,
      }),
    },
  ),
);
