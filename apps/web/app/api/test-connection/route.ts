import { NextResponse } from "next/server";

import { getProvider } from "@/lib/providers";

interface TestConnectionRequest {
  providerId: string;
  apiKey: string;
  baseUrl: string;
}

/**
 * 服务端测试连接并顺带拉取模型列表。
 * 浏览器直连中转常被 CORS 拦截（预检 403、无 ACAO），必须走同源代理。
 */
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

    const config = {
      id: providerId,
      providerType: providerId,
      displayName: providerId,
      apiKey,
      baseUrl,
      defaultParams: {
        model: provider.defaultModel,
        size: "1024x1024",
        quality: "auto",
        n: 1,
      },
      connectionStatus: "unknown" as const,
    };

    const ok = await provider.testConnection(config);
    const models = ok && provider.listModels
      ? await provider.listModels(config).catch(() => [])
      : [];

    return NextResponse.json({ ok, models });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
