import { NextResponse } from "next/server";

import { getProvider } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const providerId = (formData.get("providerId") as string) ?? "openai";
    const prompt = formData.get("prompt") as string;
    const image = formData.get("image") as Blob | null;
    const model = formData.get("model") as string;
    const size = formData.get("size") as string;
    const quality = formData.get("quality") as string;
    const n = parseInt(formData.get("n") as string, 10) || 1;
    const apiKey = formData.get("apiKey") as string;
    const baseUrl = formData.get("baseUrl") as string;

    if (!prompt || !image || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const provider = getProvider(providerId);
    if (!provider?.edit) {
      return NextResponse.json(
        { error: `Provider "${providerId}" does not support edit` },
        { status: 400 },
      );
    }

    const result = await provider.edit(
      prompt,
      image,
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
