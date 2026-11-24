import type {
  GenerateOptions,
  GenerateResult,
  ImageInput,
  ImageProvider,
  Model,
  ProviderConfig,
} from "@super-image/utils";

interface OpenAIImageResponse {
  data: {
    b64_json?: string;
    revised_prompt?: string;
  }[];
}

interface OpenAIModelsResponse {
  data?: { id: string; display_name?: string }[];
}

/** 内置兜底模型：服务商未拉取 /models 或拉取失败时使用 */
const FALLBACK_MODELS: Model[] = [
  { id: "gpt-image-2.6", name: "GPT Image 2.6" },
  { id: "gpt-image-2.5-sunburst", name: "GPT Image 2.5 Sunburst" },
  { id: "gpt-image-2.5-flare", name: "GPT Image 2.5 Flare" },
  { id: "gpt-image-2.5", name: "GPT Image 2.5" },
  { id: "gpt-image-2", name: "GPT Image 2" },
];

const IMAGE_MODEL_PATTERN =
  /image|dall-?e|flux|sd-?xl|seedream|nano-?banana|midjourney|imagen/i;

async function callOpenAI(
  endpoint: string,
  body: Record<string, unknown> | FormData,
  config: ProviderConfig,
  signal?: AbortSignal,
): Promise<OpenAIImageResponse> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: isFormData ? body : JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: { message: res.statusText } }));
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ??
        `API error: ${res.status}`,
    );
  }

  return res.json() as Promise<OpenAIImageResponse>;
}

/**
 * 把统一的 GenerateParams 映射成 OpenAI 图像接口字段。
 * 帧相关参数只在 GIF 格式下发送，避免非 GIF 模型收到无意义字段。
 */
function buildRequestFields(options: GenerateOptions): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    model: options.model,
    size: options.size,
    quality: options.quality,
    n: options.n,
    response_format: "b64_json",
  };

  if (options.outputFormat) {
    fields.output_format = options.outputFormat;
  }
  if (options.complexity) {
    fields.complexity = options.complexity;
  }
  if (options.moderation) {
    fields.moderation = options.moderation;
  }
  if (options.transparent) {
    fields.background = "transparent";
  }
  if (options.outputFormat === "gif") {
    if (options.frameCount) fields.frame_count = options.frameCount;
    if (options.frameDurationMs) {
      fields.frame_duration_ms = options.frameDurationMs;
    }
  }

  return fields;
}

function appendFields(formData: FormData, fields: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, String(value));
  }
}

function toGenerateResult(data: OpenAIImageResponse): GenerateResult {
  return {
    images: data.data.map((img, i) => ({
      id: `img-${Date.now()}-${i}`,
      b64Json: img.b64_json ?? "",
      revisedPrompt: img.revised_prompt,
    })),
  };
}

/** 不同服务商的 /models 字段不统一，兼容 id / display_name / name */
function parseModels(payload: OpenAIModelsResponse): Model[] {
  const entries = payload.data ?? [];
  return entries.map((m) => ({
    id: m.id,
    name: m.display_name ?? m.id,
  }));
}

export const openaiProvider: ImageProvider = {
  id: "openai",
  name: "OpenAI",
  icon: "🤖",
  models: FALLBACK_MODELS,
  defaultModel: "gpt-image-2",
  supportedSizes: ["1024x1024", "1024x1536", "1536x1024", "auto"],
  supportedQualities: ["auto", "low", "medium", "high", "xhigh", "max"],
  maxN: 4,

  async listModels(config: ProviderConfig): Promise<Model[]> {
    const res = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`列出模型失败：HTTP ${res.status}`);
    }
    const all = parseModels((await res.json()) as OpenAIModelsResponse);
    const imageModels = all.filter((m) => IMAGE_MODEL_PATTERN.test(m.id));
    return imageModels.length > 0 ? imageModels : all;
  },

  async generate(
    prompt: string,
    options: GenerateOptions,
    config: ProviderConfig,
    signal?: AbortSignal,
  ): Promise<GenerateResult> {
    const response = await callOpenAI(
      "/images/generations",
      { ...buildRequestFields(options), prompt },
      config,
      signal,
    );
    return toGenerateResult(response);
  },

  async edit(
    prompt: string,
    image: Blob,
    options: GenerateOptions,
    config: ProviderConfig,
    signal?: AbortSignal,
  ): Promise<GenerateResult> {
    const formData = new FormData();
    appendFields(formData, buildRequestFields(options));
    formData.append("prompt", prompt);
    formData.append("image", image, "image.png");

    const response = await callOpenAI(
      "/images/edits",
      formData,
      config,
      signal,
    );
    return toGenerateResult(response);
  },

  async generateWithRefs(
    prompt: string,
    referenceImages: ImageInput[],
    options: GenerateOptions,
    config: ProviderConfig,
    signal?: AbortSignal,
  ): Promise<GenerateResult> {
    if (referenceImages.length === 0) {
      throw new Error("No reference images provided");
    }

    // Use /images/edits with image[]= for multiple reference images
    const formData = new FormData();
    appendFields(formData, buildRequestFields(options));
    formData.append("prompt", prompt);

    for (const ref of referenceImages) {
      const [header, b64] = ref.base64DataUrl.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: mime });
      formData.append("image[]", blob, "reference.png");
    }

    const response = await callOpenAI("/images/edits", formData, config, signal);
    return toGenerateResult(response);
  },

  async testConnection(config: ProviderConfig): Promise<boolean> {
    try {
      const res = await fetch(`${config.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
