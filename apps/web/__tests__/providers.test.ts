import { describe, it, expect, vi } from "vitest";

import {
  getAllProviders,
  getProvider,
  openaiProvider,
} from "../lib/providers";

// ---- Registry ----

describe("provider registry", () => {
  it("openai provider is registered by default", () => {
    const provider = getProvider("openai");
    expect(provider).toBeDefined();
    expect(provider?.id).toBe("openai");
  });

  it("getAllProviders returns registered providers", () => {
    const all = getAllProviders();
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all.some((p) => p.id === "openai")).toBe(true);
  });
});

// ---- OpenAI Provider ----

describe("openai provider", () => {
  it("has correct metadata", () => {
    expect(openaiProvider.id).toBe("openai");
    expect(openaiProvider.name).toBe("OpenAI");
    expect(openaiProvider.models.length).toBeGreaterThan(0);
    expect(openaiProvider.supportedSizes).toContain("1024x1024");
    expect(openaiProvider.supportedQualities).toContain("auto");
  });

  it("has generate and edit methods", () => {
    expect(typeof openaiProvider.generate).toBe("function");
    expect(typeof openaiProvider.edit).toBe("function");
    expect(typeof openaiProvider.testConnection).toBe("function");
  });

  it("generate calls fetch with correct params", async () => {
    const mockResponse = {
      data: [
        {
          b64_json: "base64data",
          revised_prompt: "A cute cat",
        },
      ],
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    globalThis.fetch = fetchSpy;

    const result = await openaiProvider.generate(
      "a cat",
      { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
      {
        id: "openai",
        apiKey: "sk-test",
        baseUrl: "https://api.example.com/v1",
        defaultModel: "gpt-image-1",
        defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
      },
    );

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/images/generations");
    expect(opts.method).toBe("POST");

    const body = JSON.parse(opts.body as string);
    expect(body.prompt).toBe("a cat");
    expect(body.response_format).toBe("b64_json");

    expect(result.images).toHaveLength(1);
    expect(result.images[0].b64Json).toBe("base64data");
    expect(result.images[0].revisedPrompt).toBe("A cute cat");
  });

  it("generate throws on API error", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: "Invalid API key" } }),
    });
    globalThis.fetch = fetchSpy;

    await expect(
      openaiProvider.generate(
        "a cat",
        { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
        {
          id: "openai",
          apiKey: "bad-key",
          baseUrl: "https://api.example.com/v1",
          defaultModel: "gpt-image-1",
          defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
        },
      ),
    ).rejects.toThrow("Invalid API key");
  });

  it("testConnection returns true on success", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchSpy;

    const result = await openaiProvider.testConnection({
      id: "openai",
      apiKey: "sk-test",
      baseUrl: "https://api.example.com/v1",
      defaultModel: "gpt-image-1",
      defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
    });
    expect(result).toBe(true);
  });

  it("testConnection returns false on failure", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error("network error"));
    globalThis.fetch = fetchSpy;

    const result = await openaiProvider.testConnection({
      id: "openai",
      apiKey: "sk-test",
      baseUrl: "https://bad.example.com/v1",
      defaultModel: "gpt-image-1",
      defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "auto", n: 1 },
    });
    expect(result).toBe(false);
  });
});
