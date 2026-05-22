/**
 * E2E test: real API call to generate an image.
 *
 * SKIPPED by default. To run:
 *   cd apps/web && TEST_E2E=1 npx vitest run e2e-generate
 *
 * Verified results:
 * - testConnection ✅ valid key → true, invalid key → false
 * - generate: code correct, but proxy (timebackward.com) may return 429
 *   when upstream is saturated. Includes retry with backoff.
 *
 * Uses minimal params (quality: low, n: 1) to keep costs low.
 */
import type { GenerateResult } from "@super-image/utils";
import { describe, it, expect } from "vitest";

import { openaiProvider } from "../lib/providers/openai";

const API_KEY = "sk-GyRQ2UHR5mG5Oa7SyyA5kyTW3kAasZ5aMbzOIwky8Ogl7UqL";
const BASE_URL = "https://api.timebackward.com/v1";
const RUN_E2E = process.env.TEST_E2E === "1";

const CONFIG = {
  id: "openai",
  providerType: "openai",
  displayName: "OpenAI",
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  defaultModel: "gpt-image-1",
  defaultParams: { model: "gpt-image-1", size: "1024x1024" as const, quality: "low" as const, n: 1 },
  connectionStatus: "unknown" as const,
};

const OPTS = { model: "gpt-image-1", size: "1024x1024", quality: "low", n: 1 };

/** Retry with exponential backoff for rate-limit / upstream saturation errors */
async function generateWithRetry(prompt: string, maxRetries = 3): Promise<GenerateResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await openaiProvider.generate(prompt, OPTS, CONFIG);
    } catch (err) {
      const msg = (err as Error).message;
      const isRetryable = msg.includes("饱和") || msg.includes("rate") || msg.includes("429");
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = (attempt + 1) * 5_000; // 5s, 10s, 15s
      console.log(`⏳ Attempt ${attempt + 1} rate-limited, retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

describe.skipIf(!RUN_E2E)("e2e: real API generate", () => {
  it(
    "generates an image and returns valid b64_json",
    async () => {
      const result = await generateWithRetry("a white cat, simple sketch");

      // Verify structure
      expect(result.images).toHaveLength(1);
      const img = result.images[0];
      expect(img.id).toBeTruthy();
      expect(img.b64Json).toBeTruthy();
      expect(img.b64Json.length).toBeGreaterThan(1000);

      // Verify it's valid base64 → can decode to bytes
      const bytes = Uint8Array.from(atob(img.b64Json), (c) => c.charCodeAt(0));
      expect(bytes.length).toBeGreaterThan(1000);

      // Verify PNG signature (first 8 bytes)
      const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
      const header = Array.from(bytes.slice(0, 8));
      expect(header).toEqual(pngSignature);

      console.log(
        `✅ Image generated: ${bytes.length} bytes, revised_prompt: "${img.revisedPrompt ?? "(none)"}"`,
      );
    },
    120_000,
  );

  it("testConnection succeeds with valid key", async () => {
    const config = {
      id: "openai",
      providerType: "openai",
      displayName: "OpenAI",
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      defaultModel: "gpt-image-1",
      defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "low", n: 1 },
      connectionStatus: "unknown" as const,
    };

    const ok = await openaiProvider.testConnection(config);
    expect(ok).toBe(true);
  });

  it("testConnection fails with invalid key", async () => {
    const config = {
      id: "openai",
      providerType: "openai",
      displayName: "OpenAI",
      apiKey: "sk-invalid-key",
      baseUrl: BASE_URL,
      defaultModel: "gpt-image-1",
      defaultParams: { model: "gpt-image-1", size: "1024x1024", quality: "low", n: 1 },
      connectionStatus: "unknown" as const,
    };

    const ok = await openaiProvider.testConnection(config);
    expect(ok).toBe(false);
  });
});
