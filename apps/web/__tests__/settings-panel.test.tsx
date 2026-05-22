import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

import { useSettingsStore } from "../stores/settings-store";
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
        defaultModel: "gpt-image-1",
        defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
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
    expect(provider.defaultModel).toBe("gpt-image-1");
    expect(provider.providerType).toBe("openai");
    expect(provider.displayName).toBe("OpenAI");
    expect(provider.connectionStatus).toBe("unknown");
  });

  it("updateProviderField works for nested defaultParams", () => {
    useSettingsStore.getState().updateProviderField(
      "openai",
      "defaultParams",
      { model: "gpt-image-1", size: "1536x1024", quality: "high", n: 2 },
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
