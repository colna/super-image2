import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

import { migrateV2, useSettingsStore } from "../stores/settings-store";
import { useUIStore } from "../stores/ui-store";

beforeEach(() => {
  useSettingsStore.setState({
    providers: {
      openai: {
        id: "openai",
        providerType: "openai",
        displayName: "OpenAI",
        apiKey: "",
        baseUrl: "https://api.openai.com/v1",
        defaultParams: { model: "gpt-image-2", size: "1024x1024", quality: "auto", n: 1 },
        connectionStatus: "unknown",
      },
    },
    activeProviderId: "openai",
  });
});

describe("settings-panel store interactions", () => {
  it("toggleSettingsPanel opens/closes panel", () => {
    useUIStore.setState({ settingsPanelOpen: false });
    useUIStore.getState().toggleSettingsPanel();
    expect(useUIStore.getState().settingsPanelOpen).toBe(true);
  });

  it("settings store has default provider config with new fields", () => {
    const state = useSettingsStore.getState();
    const provider = state.providers[state.activeProviderId];
    expect(provider).toBeDefined();
    expect(provider.baseUrl).toContain("openai.com");
    expect(provider.defaultParams.model).toBe("gpt-image-2");
    expect(provider.providerType).toBe("openai");
    expect(provider.displayName).toBe("OpenAI");
    expect(provider.connectionStatus).toBe("unknown");
  });

  it("updateProviderField works for nested defaultParams", () => {
    useSettingsStore.getState().updateProviderField(
      "openai",
      "defaultParams",
      { model: "gpt-image-2", size: "1536x1024", quality: "high", n: 2 },
    );
    const state = useSettingsStore.getState();
    expect(state.providers.openai.defaultParams.size).toBe("1536x1024");
    expect(state.providers.openai.defaultParams.n).toBe(2);
  });

  it("multi-provider: add, select, delete", () => {
    const id = useSettingsStore.getState().addProvider("openai", "Second Provider");
    expect(useSettingsStore.getState().providers[id]).toBeDefined();

    useSettingsStore.getState().setActiveProviderId(id);
    expect(useSettingsStore.getState().activeProviderId).toBe(id);

    useSettingsStore.getState().removeProvider(id);
    expect(useSettingsStore.getState().providers[id]).toBeUndefined();
    expect(useSettingsStore.getState().activeProviderId).toBe("openai");
  });
});

describe("settings migration v2 → v3", () => {
  it("folds legacy defaultModel into defaultParams.model", () => {
    const migrated = migrateV2({
      activeProviderId: "yundu",
      providers: {
        yundu: {
          id: "yundu",
          providerType: "openai",
          displayName: "yundu",
          apiKey: "sk-x",
          baseUrl: "https://gd.yundu.lol/v1",
          defaultModel: "gpt-image-2.5-sunburst",
          defaultParams: {
            model: "gpt-image-2",
            size: "1024x1024",
            quality: "auto",
            n: 1,
          },
          connectionStatus: "unknown",
        },
      },
    }) as {
      providers: Record<string, { defaultParams: { model: string; frameCount?: number } }>;
    };

    expect(migrated.providers.yundu.defaultParams.model).toBe(
      "gpt-image-2.5-sunburst",
    );
    expect(migrated.providers.yundu.defaultParams.frameCount).toBe(9);
  });
});
