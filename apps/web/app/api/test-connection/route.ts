import { NextResponse } from "next/server";

import { getProvider } from "@/lib/providers";

interface TestConnectionRequest {
  providerId: string;
  apiKey: string;
  baseUrl: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TestConnectionRequest;
    const { providerId, apiKey, baseUrl } = body;

    if (!apiKey || !baseUrl) {
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

    const ok = await provider.testConnection({
      id: providerId,
      providerType: providerId,
      displayName: providerId,
      apiKey,
      baseUrl,
      defaultModel: provider.defaultModel,
      defaultParams: { model: provider.defaultModel, size: "1024x1024", quality: "auto", n: 1 },
      connectionStatus: "unknown",
    });

    return NextResponse.json({ ok });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
