import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";

import { useSettingsStore } from "../stores/settings-store";
import { useUIStore } from "../stores/ui-store";

// Test settings panel interactions via store logic (no render needed for Task 3.1)
describe("settings-panel store interactions", () => {
  it("toggleSettingsPanel opens/closes panel", () => {
    useUIStore.setState({ settingsPanelOpen: false });
    useUIStore.getState().toggleSettingsPanel();
    expect(useUIStore.getState().settingsPanelOpen).toBe(true);
  });

  it("settings store has default provider config", () => {
    const state = useSettingsStore.getState();
    const provider = state.providers[state.activeProviderId];
    expect(provider).toBeDefined();
    expect(provider.baseUrl).toContain("openai.com");
    expect(provider.defaultModel).toBe("gpt-image-1");
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
});
