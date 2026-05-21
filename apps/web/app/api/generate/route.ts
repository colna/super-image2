import { NextResponse } from "next/server";

import { getProvider } from "@/lib/providers";

interface GenerateRequest {
  providerId: string;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  n: number;
  apiKey: string;
  baseUrl: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const { providerId, prompt, model, size, quality, n, apiKey, baseUrl } = body;

    if (!prompt || !apiKey) {
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

    const result = await provider.generate(
      prompt,
      { model, size, quality, n },
      {
        id: providerId,
        apiKey,
        baseUrl,
        defaultModel: model,
        defaultParams: { model, size, quality, n },
      },
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
