import type { GenerateParams } from "@super-image/utils";
import { NextResponse } from "next/server";

import { getProvider } from "@/lib/providers";

/** 中转单张常需 60~250s，本地不限制，部署到 Serverless 时按平台上限放宽 */
export const maxDuration = 300;

interface GenerateRequest extends GenerateParams {
  providerId: string;
  prompt: string;
  apiKey: string;
  baseUrl: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const {
      providerId,
      prompt,
      apiKey,
      baseUrl,
      model,
      size,
      quality,
      n,
      complexity,
      outputFormat,
      frameCount,
      frameDurationMs,
      transparent,
      moderation,
    } = body;

    if (!prompt || !apiKey || !baseUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const provider = getProvider(providerId ?? "openai");
    if (!provider) {
      return NextResponse.json(
        { error: `Provider "${providerId}" not found` },
        { status: 400 },
      );
    }

    const params: GenerateParams = {
      model,
      size,
      quality,
      n,
      complexity,
      outputFormat,
      frameCount,
      frameDurationMs,
      transparent,
      moderation,
    };

    const result = await provider.generate(prompt, params, {
      id: providerId,
      providerType: providerId,
      displayName: providerId,
      apiKey,
      baseUrl,
      defaultParams: params,
      connectionStatus: "unknown",
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
