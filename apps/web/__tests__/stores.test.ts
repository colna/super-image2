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
          providerType: "openai",
          displayName: "OpenAI",
          apiKey: "",
          baseUrl: "https://api.openai.com/v1",
          defaultModel: "gpt-image-1",
          defaultParams: {
            model: "gpt-image-1",
            size: "1024x1024",
            quality: "auto",
            n: 1,
          },
          connectionStatus: "unknown",
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
    expect(provider?.providerType).toBe("openai");
    expect(provider?.displayName).toBe("OpenAI");
  });

  it("setProvider adds a new provider", () => {
    useSettingsStore.getState().setProvider({
      id: "custom",
      providerType: "openai",
      displayName: "Custom",
      apiKey: "key",
      baseUrl: "https://example.com",
      defaultModel: "model-1",
      defaultParams: { model: "model-1", size: "512x512", quality: "auto", n: 1 },
      connectionStatus: "unknown",
    });
    const state = useSettingsStore.getState();
    expect(state.providers.custom).toBeDefined();
    expect(state.providers.custom.displayName).toBe("Custom");
  });

  it("removeProvider removes a provider", () => {
    useSettingsStore.getState().removeProvider("openai");
    const state = useSettingsStore.getState();
    expect(state.providers.openai).toBeUndefined();
  });

  it("removeProvider switches active when deleting active provider", () => {
    useSettingsStore.getState().setProvider({
      id: "second",
      providerType: "openai",
      displayName: "Second",
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      defaultModel: "gpt-image-1",
      defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
      connectionStatus: "unknown",
    });
    useSettingsStore.getState().removeProvider("openai");
    const state = useSettingsStore.getState();
    expect(state.activeProviderId).toBe("second");
  });

  it("updateProviderField updates a single field", () => {
    useSettingsStore.getState().updateProviderField("openai", "apiKey", "sk-test");
    const state = useSettingsStore.getState();
    expect(state.providers.openai.apiKey).toBe("sk-test");
  });

  it("addProvider creates a new provider with UUID", () => {
    const id = useSettingsStore.getState().addProvider("openai", "My GPT");
    const state = useSettingsStore.getState();
    expect(state.providers[id]).toBeDefined();
    expect(state.providers[id].providerType).toBe("openai");
    expect(state.providers[id].displayName).toBe("My GPT");
    expect(state.providers[id].connectionStatus).toBe("unknown");
    expect(state.providers[id].baseUrl).toBe("https://api.openai.com/v1");
  });

  it("updateConnectionStatus sets status and error", () => {
    useSettingsStore.getState().updateConnectionStatus("openai", "connected");
    expect(useSettingsStore.getState().providers.openai.connectionStatus).toBe("connected");

    useSettingsStore.getState().updateConnectionStatus("openai", "error", "Bad key");
    const provider = useSettingsStore.getState().providers.openai;
    expect(provider.connectionStatus).toBe("error");
    expect(provider.connectionError).toBe("Bad key");
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
