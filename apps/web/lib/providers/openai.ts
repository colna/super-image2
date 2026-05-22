import type {
  GenerateOptions,
  GenerateResult,
  ImageInput,
  ImageProvider,
  ProviderConfig,
} from "@super-image/utils";

interface OpenAIImageResponse {
  data: {
    b64_json?: string;
    revised_prompt?: string;
  }[];
}

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

function toGenerateResult(data: OpenAIImageResponse): GenerateResult {
  return {
    images: data.data.map((img, i) => ({
      id: `img-${Date.now()}-${i}`,
      b64Json: img.b64_json ?? "",
      revisedPrompt: img.revised_prompt,
    })),
  };
}

export const openaiProvider: ImageProvider = {
  id: "openai",
  name: "OpenAI",
  icon: "🤖",
  models: [{ id: "gpt-image-2", name: "GPT Image 2" }],
  defaultModel: "gpt-image-2",
  supportedSizes: ["1024x1024", "1024x1536", "1536x1024", "auto"],
  supportedQualities: ["auto", "low", "medium", "high"],
  maxN: 4,

  async generate(
    prompt: string,
    options: GenerateOptions,
    config: ProviderConfig,
    signal?: AbortSignal,
  ): Promise<GenerateResult> {
    const response = await callOpenAI(
      "/images/generations",
      {
        model: options.model,
        prompt,
        size: options.size,
        quality: options.quality,
        n: options.n,
        response_format: "b64_json",
      },
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
    formData.append("model", options.model);
    formData.append("prompt", prompt);
    formData.append("image", image, "image.png");
    formData.append("size", options.size);
    formData.append("quality", options.quality);
    formData.append("n", String(options.n));
    formData.append("response_format", "b64_json");

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
    // Use /images/edits with the first reference image as source
    const ref = referenceImages[0];
    if (!ref) {
      throw new Error("No reference images provided");
    }

    // Convert base64 data URL → Blob
    const [header, b64] = ref.base64DataUrl.split(",");
    const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });

    const formData = new FormData();
    formData.append("model", options.model);
    formData.append("prompt", prompt);
    formData.append("image", blob, "reference.png");
    formData.append("size", options.size);
    formData.append("quality", options.quality);
    formData.append("n", String(options.n));
    formData.append("response_format", "b64_json");

    const response = await callOpenAI(
      "/images/edits",
      formData,
      config,
      signal,
    );
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
