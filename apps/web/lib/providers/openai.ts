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
    if (referenceImages.length === 0) {
      throw new Error("No reference images provided");
    }

    // Build input: reference images + text prompt
    const input: unknown[] = referenceImages.map((ref) => ({
      type: "input_image",
      image_url: ref.base64DataUrl,
    }));
    input.push({ type: "input_text", text: prompt });

    const body = {
      model: options.model,
      input,
      tools: [
        {
          type: "image_generation",
          size: options.size,
          quality: options.quality,
        },
      ],
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(`${config.baseUrl}/responses`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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

    interface ResponsesOutput {
      type: string;
      result?: string;
      revised_prompt?: string;
    }
    const data = (await res.json()) as { output: ResponsesOutput[] };

    const images = data.output
      .filter((item) => item.type === "image_generation_call")
      .map((item, i) => ({
        id: `img-${Date.now()}-${i}`,
        b64Json: item.result ?? "",
        revisedPrompt: item.revised_prompt,
      }));

    return { images };
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
