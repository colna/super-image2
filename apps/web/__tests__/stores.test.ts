import "fake-indexeddb/auto";
import type { Message } from "@super-image/utils";
import { describe, it, expect, beforeEach } from "vitest";

import { db, getMessage } from "../lib/db";
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
          defaultModel: "gpt-image-2",
          defaultParams: {
            model: "gpt-image-2",
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
      defaultParams: {
        model: "model-1",
        size: "512x512",
        quality: "auto",
        n: 1,
      },
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
      defaultModel: "gpt-image-2",
      defaultParams: {
        model: "gpt-image-2",
        size: "1024x1024",
        quality: "auto",
        n: 1,
      },
      connectionStatus: "unknown",
    });
    useSettingsStore.getState().removeProvider("openai");
    const state = useSettingsStore.getState();
    expect(state.activeProviderId).toBe("second");
  });

  it("updateProviderField updates a single field", () => {
    useSettingsStore
      .getState()
      .updateProviderField("openai", "apiKey", "sk-test");
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
    expect(useSettingsStore.getState().providers.openai.connectionStatus).toBe(
      "connected",
    );

    useSettingsStore
      .getState()
      .updateConnectionStatus("openai", "error", "Bad key");
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

// ---- Chat Store: localBlobUrl 持久化回归测试 ----

describe("chat-store updateMessage persistence", () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.messages.clear();
    await db.imageStore.clear();
    useChatStore.setState({
      messages: [],
      loading: false,
      generating: false,
      abortController: null,
    });
  });

  it("keeps localBlobUrl in memory but strips it from IndexedDB", async () => {
    const msg: Message = {
      id: "msg-blob",
      sessionId: "s1",
      role: "assistant",
      type: "generate",
      content: "",
      createdAt: Date.now(),
      status: "generating",
    };
    await useChatStore.getState().addMessage(msg);

    await useChatStore.getState().updateMessage("msg-blob", {
      status: "done",
      images: [
        {
          id: "img-1",
          revisedPrompt: "a cat",
          localBlobUrl: "blob:test/transient",
        },
      ],
    });

    // 当前会话内存中保留 localBlobUrl，用于即时展示
    const inMemory = useChatStore
      .getState()
      .messages.find((m) => m.id === "msg-blob");
    expect(inMemory?.images?.[0]?.localBlobUrl).toBe("blob:test/transient");

    // IndexedDB 不持久化 localBlobUrl（刷新后从此读取，失效的临时 URL 不应残留）
    const persisted = await getMessage("msg-blob");
    expect(persisted?.status).toBe("done");
    expect(persisted?.images?.[0]?.id).toBe("img-1");
    expect(persisted?.images?.[0]?.revisedPrompt).toBe("a cat");
    expect(persisted?.images?.[0]?.localBlobUrl).toBeUndefined();
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
