import type { GenerateParams, ImageInput } from "@super-image/utils";
import { NextResponse } from "next/server";

import { getProvider } from "@/lib/providers";

export const maxDuration = 300;

function parseNumber(value: FormDataEntryValue | null): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function toDataUrl(file: Blob): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const providerId = (formData.get("providerId") as string) ?? "openai";
    const prompt = formData.get("prompt") as string;
    const apiKey = formData.get("apiKey") as string;
    const baseUrl = formData.get("baseUrl") as string;

    const images = [
      ...formData.getAll("image"),
      ...formData.getAll("image[]"),
    ].filter((entry): entry is File => entry instanceof Blob);

    if (!prompt || images.length === 0 || !apiKey || !baseUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const provider = getProvider(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: `Provider "${providerId}" does not support edit` },
        { status: 400 },
      );
    }

    const params: GenerateParams = {
      model: formData.get("model") as string,
      size: formData.get("size") as string,
      quality: formData.get("quality") as string,
      n: parseNumber(formData.get("n")) ?? 1,
      complexity: (formData.get("complexity") as GenerateParams["complexity"]) ?? undefined,
      outputFormat:
        (formData.get("output_format") as GenerateParams["outputFormat"]) ??
        undefined,
      frameCount: parseNumber(formData.get("frame_count")),
      frameDurationMs: parseNumber(formData.get("frame_duration_ms")),
      transparent: formData.get("background") === "transparent" ? true : undefined,
      moderation:
        (formData.get("moderation") as GenerateParams["moderation"]) ?? undefined,
    };

    const config = {
      id: providerId,
      providerType: providerId,
      displayName: providerId,
      apiKey,
      baseUrl,
      defaultParams: params,
      connectionStatus: "unknown" as const,
    };

    if (images.length === 1 && provider.edit) {
      const result = await provider.edit(prompt, images[0], params, config);
      return NextResponse.json(result);
    }

    if (!provider.generateWithRefs) {
      return NextResponse.json(
        { error: `Provider "${providerId}" does not support reference images` },
        { status: 400 },
      );
    }

    const refs: ImageInput[] = await Promise.all(
      images.map(async (file) => ({ base64DataUrl: await toDataUrl(file) })),
    );
    const result = await provider.generateWithRefs(prompt, refs, params, config);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
