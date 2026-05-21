import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

import { useChatStore } from "../stores/chat-store";
import { useSettingsStore } from "../stores/settings-store";
import { useUIStore } from "../stores/ui-store";

// ---- Settings Store ----

describe("settings-store", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      providers: {
        openai: {
          id: "openai",
          apiKey: "",
          baseUrl: "https://api.openai.com/v1",
          defaultModel: "gpt-image-1",
          defaultParams: {
            model: "gpt-image-1",
            size: "1024x1024",
            quality: "auto",
            n: 1,
          },
        },
      },
      activeProviderId: "openai",
    });
  });

  it("has default openai provider", () => {
    const state = useSettingsStore.getState();
    expect(state.providers.openai).toBeDefined();
    expect(state.activeProviderId).toBe("openai");
  });

  it("getActiveProvider returns current provider", () => {
    const provider = useSettingsStore.getState().getActiveProvider();
    expect(provider?.id).toBe("openai");
  });

  it("setProvider adds a new provider", () => {
    useSettingsStore.getState().setProvider({
      id: "custom",
      apiKey: "key",
      baseUrl: "https://example.com",
      defaultModel: "model-1",
      defaultParams: { model: "model-1", size: "512x512", quality: "auto", n: 1 },
    });
    const state = useSettingsStore.getState();
    expect(state.providers.custom).toBeDefined();
  });

  it("removeProvider removes a provider", () => {
    useSettingsStore.getState().removeProvider("openai");
    const state = useSettingsStore.getState();
    expect(state.providers.openai).toBeUndefined();
  });

  it("updateProviderField updates a single field", () => {
    useSettingsStore.getState().updateProviderField("openai", "apiKey", "sk-test");
    const state = useSettingsStore.getState();
    expect(state.providers.openai.apiKey).toBe("sk-test");
  });
});

// ---- Chat Store (sync operations only) ----

describe("chat-store", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      loading: false,
      generating: false,
      abortController: null,
    });
  });

  it("setGenerating toggles state", () => {
    useChatStore.getState().setGenerating(true);
    expect(useChatStore.getState().generating).toBe(true);
  });

  it("cancelGeneration aborts and resets", () => {
    const controller = new AbortController();
    useChatStore.setState({ abortController: controller, generating: true });
    useChatStore.getState().cancelGeneration();

    const state = useChatStore.getState();
    expect(state.generating).toBe(false);
    expect(state.abortController).toBeNull();
    expect(controller.signal.aborted).toBe(true);
  });

  it("clearMessages empties the list", () => {
    useChatStore.setState({
      messages: [
        {
          id: "1",
          sessionId: "s1",
          role: "user",
          type: "generate",
          content: "test",
          createdAt: Date.now(),
          status: "done",
        },
      ],
    });
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});

// ---- UI Store ----

describe("ui-store", () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true, settingsPanelOpen: false });
  });

  it("toggleSidebar flips state", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("toggleSettingsPanel flips state", () => {
    useUIStore.getState().toggleSettingsPanel();
    expect(useUIStore.getState().settingsPanelOpen).toBe(true);
  });

  it("setSidebarOpen sets explicitly", () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });
});
