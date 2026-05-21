import { describe, it, expect, vi } from "vitest";

import { POST as generatePost } from "../app/api/generate/route";
import { POST as testConnectionPost } from "../app/api/test-connection/route";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate", () => {
  it("returns 400 when prompt is missing", async () => {
    const res = await generatePost(
      makeRequest({ providerId: "openai", apiKey: "sk-test" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing");
  });

  it("returns 400 when provider is not found", async () => {
    const res = await generatePost(
      makeRequest({
        providerId: "unknown",
        prompt: "a cat",
        apiKey: "sk-test",
        baseUrl: "https://example.com",
        model: "m",
        size: "1024x1024",
        quality: "auto",
        n: 1,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns result on success", async () => {
    const mockResponse = {
      data: [{ b64_json: "base64img", revised_prompt: "revised" }],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const res = await generatePost(
      makeRequest({
        providerId: "openai",
        prompt: "a cat",
        apiKey: "sk-test",
        baseUrl: "https://api.example.com/v1",
        model: "gpt-image-1",
        size: "1024x1024",
        quality: "auto",
        n: 1,
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.images).toHaveLength(1);
    expect(json.images[0].b64Json).toBe("base64img");
  });
});

describe("POST /api/test-connection", () => {
  it("returns 400 when apiKey is missing", async () => {
    const res = await testConnectionPost(
      makeRequest({ providerId: "openai", baseUrl: "https://x.com" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns ok: true on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );
    const res = await testConnectionPost(
      makeRequest({
        providerId: "openai",
        apiKey: "sk-test",
        baseUrl: "https://api.example.com/v1",
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
