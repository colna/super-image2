import { describe, it, expect, vi } from "vitest";

import { getAllProviders, getProvider, openaiProvider } from "../lib/providers";

function makeConfig(
  overrides: Partial<{ apiKey: string; baseUrl: string }> = {},
) {
  return {
    id: "openai",
    providerType: "openai",
    displayName: "OpenAI",
    apiKey: overrides.apiKey ?? "sk-test",
    baseUrl: overrides.baseUrl ?? "https://api.example.com/v1",
    defaultModel: "gpt-image-2",
    defaultParams: {
      model: "gpt-image-2",
      size: "1024x1024",
      quality: "auto",
      n: 1,
    },
    connectionStatus: "unknown" as const,
  };
}

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

  it("has generate, edit, and generateWithRefs methods", () => {
    expect(typeof openaiProvider.generate).toBe("function");
    expect(typeof openaiProvider.edit).toBe("function");
    expect(typeof openaiProvider.generateWithRefs).toBe("function");
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
      { model: "gpt-image-2", size: "1024x1024", quality: "auto", n: 1 },
      makeConfig(),
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
        { model: "gpt-image-2", size: "1024x1024", quality: "auto", n: 1 },
        makeConfig({ apiKey: "bad-key" }),
      ),
    ).rejects.toThrow("Invalid API key");
  });

  it("generateWithRefs calls /responses with Responses API format", async () => {
    const mockResponse = {
      output: [
        {
          type: "image_generation_call",
          result: "base64imagedata",
          revised_prompt: "A red square",
        },
      ],
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    globalThis.fetch = fetchSpy;

    const b64 = btoa("fakepng");
    const result = await openaiProvider.generateWithRefs!(
      "a red square",
      [{ base64DataUrl: `data:image/png;base64,${b64}` }],
      { model: "gpt-image-2", size: "1024x1024", quality: "low", n: 1 },
      makeConfig(),
    );

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/responses");
    expect(opts.method).toBe("POST");

    // Body should be JSON with input array and tools
    const body = JSON.parse(opts.body as string);
    expect(body.model).toBe("gpt-image-2");
    expect(body.input).toHaveLength(2);
    expect(body.input[0].type).toBe("input_image");
    expect(body.input[0].image_url).toBe(`data:image/png;base64,${b64}`);
    expect(body.input[1].type).toBe("input_text");
    expect(body.input[1].text).toBe("a red square");
    expect(body.tools).toHaveLength(1);
    expect(body.tools[0].type).toBe("image_generation");
    expect(body.tools[0].quality).toBe("low");

    expect(result.images).toHaveLength(1);
    expect(result.images[0].b64Json).toBe("base64imagedata");
    expect(result.images[0].revisedPrompt).toBe("A red square");
  });

  it("generateWithRefs passes all reference images in input", async () => {
    const mockResponse = {
      output: [{ type: "image_generation_call", result: "img1data" }],
    };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    globalThis.fetch = fetchSpy;

    const b64a = btoa("imgA");
    const b64b = btoa("imgB");
    await openaiProvider.generateWithRefs!(
      "merge these",
      [
        { base64DataUrl: `data:image/png;base64,${b64a}` },
        { base64DataUrl: `data:image/png;base64,${b64b}` },
      ],
      { model: "gpt-image-2", size: "1024x1024", quality: "auto", n: 1 },
      makeConfig(),
    );

    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/v1/responses");
    const body = JSON.parse(opts.body as string);
    // Both images + text prompt = 3 input items
    expect(body.input).toHaveLength(3);
    expect(body.input[0].type).toBe("input_image");
    expect(body.input[1].type).toBe("input_image");
    expect(body.input[2].type).toBe("input_text");
  });

  it("generateWithRefs throws when no reference images", async () => {
    await expect(
      openaiProvider.generateWithRefs!(
        "something",
        [],
        { model: "gpt-image-2", size: "1024x1024", quality: "auto", n: 1 },
        makeConfig(),
      ),
    ).rejects.toThrow("No reference images provided");
  });

  it("testConnection returns true on success", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchSpy;

    const result = await openaiProvider.testConnection(makeConfig());
    expect(result).toBe(true);
  });

  it("testConnection returns false on failure", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error("network error"));
    globalThis.fetch = fetchSpy;

    const result = await openaiProvider.testConnection(
      makeConfig({ baseUrl: "https://bad.example.com/v1" }),
    );
    expect(result).toBe(false);
  });
});
