import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { db, addSession, getMessagesBySession, getImage } from "../lib/db";
import { useChatStore } from "../stores/chat-store";
import { useSettingsStore } from "../stores/settings-store";

function makeProviderConfig(overrides: Partial<{ apiKey: string }> = {}) {
  return {
    id: "openai",
    providerType: "openai",
    displayName: "OpenAI",
    apiKey: overrides.apiKey ?? "sk-test",
    baseUrl: "https://api.example.com/v1",
    defaultModel: "gpt-image-1",
    defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
    connectionStatus: "unknown" as const,
  };
}

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

describe("sendGenerate", () => {
  it("creates user + AI messages and stores images", async () => {
    useSettingsStore.setState({
      providers: { openai: makeProviderConfig() },
      activeProviderId: "openai",
    });

    const sessionId = "test-session";
    await addSession({
      id: sessionId,
      title: "Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      providerId: "openai",
      modelId: "gpt-image-1",
    });

    const fakeB64 = btoa("fake-png-data");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              { b64_json: fakeB64, revised_prompt: "A revised prompt" },
            ],
          }),
      }),
    );

    await useChatStore.getState().sendGenerate(sessionId, "a cat", {
      size: "1024x1024",
      quality: "auto",
      n: 1,
    });

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[0].content).toBe("a cat");
    expect(state.messages[1].role).toBe("assistant");
    expect(state.messages[1].status).toBe("done");
    expect(state.messages[1].images).toHaveLength(1);
    expect(state.generating).toBe(false);

    const dbMessages = await getMessagesBySession(sessionId);
    expect(dbMessages).toHaveLength(2);

    const imageId = state.messages[1].images![0].id;
    const storedImage = await getImage(imageId);
    expect(storedImage).toBeDefined();
    expect(storedImage!.messageId).toBe(state.messages[1].id);
  });

  it("handles API errors gracefully", async () => {
    useSettingsStore.setState({
      providers: { openai: makeProviderConfig({ apiKey: "sk-bad" }) },
      activeProviderId: "openai",
    });

    const sessionId = "error-session";
    await addSession({
      id: sessionId,
      title: "Error Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      providerId: "openai",
      modelId: "gpt-image-1",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: "Invalid API key" } }),
      }),
    );

    await useChatStore.getState().sendGenerate(sessionId, "a dog", {
      size: "1024x1024",
      quality: "auto",
      n: 1,
    });

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].status).toBe("error");
    expect(state.messages[1].content).toContain("Invalid API key");
    expect(state.generating).toBe(false);
  });

  it("supports cancellation via AbortController", async () => {
    useSettingsStore.setState({
      providers: { openai: makeProviderConfig() },
      activeProviderId: "openai",
    });

    const sessionId = "cancel-session";
    await addSession({
      id: sessionId,
      title: "Cancel Test",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      providerId: "openai",
      modelId: "gpt-image-1",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, opts: RequestInit) =>
        new Promise((_resolve, reject) => {
          opts.signal?.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          );
        }),
      ),
    );

    const generatePromise = useChatStore.getState().sendGenerate(sessionId, "a bird", {
      size: "1024x1024",
      quality: "auto",
      n: 1,
    });

    await new Promise((r) => setTimeout(r, 10));
    useChatStore.getState().cancelGeneration();

    await generatePromise;

    const state = useChatStore.getState();
    expect(state.messages[1].status).toBe("error");
    expect(state.messages[1].content).toContain("cancelled");
  });
});
