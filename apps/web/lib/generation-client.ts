import type {
  GenerateParams,
  GenerateResult,
  ProviderConfig,
} from "@super-image/utils";

/**
 * 生图请求统一走同源 API 路由。
 *
 * 浏览器直连第三方中转会被 CORS 拦截（预检 403 / 无 ACAO），
 * 由 Next 服务端转发才能稳定工作，也顺带避免 key 出现在第三方页面请求里。
 */
async function readResult(res: Response): Promise<GenerateResult> {
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `API error: ${res.status}`);
  }
  return data as GenerateResult;
}

function appendParams(formData: FormData, params: GenerateParams): void {
  formData.append("model", params.model);
  formData.append("size", params.size);
  formData.append("quality", params.quality);
  formData.append("n", String(params.n));
  if (params.complexity) formData.append("complexity", params.complexity);
  if (params.outputFormat) {
    formData.append("output_format", params.outputFormat);
  }
  if (params.outputFormat === "gif") {
    if (params.frameCount) {
      formData.append("frame_count", String(params.frameCount));
    }
    if (params.frameDurationMs) {
      formData.append("frame_duration_ms", String(params.frameDurationMs));
    }
  }
  if (params.transparent) formData.append("background", "transparent");
  if (params.moderation) formData.append("moderation", params.moderation);
}

function appendCredentials(
  formData: FormData,
  config: ProviderConfig,
  prompt: string,
): void {
  formData.append("providerId", config.providerType);
  formData.append("apiKey", config.apiKey);
  formData.append("baseUrl", config.baseUrl);
  formData.append("prompt", prompt);
}

export async function requestGenerate(
  config: ProviderConfig,
  prompt: string,
  params: GenerateParams,
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      providerId: config.providerType,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      prompt,
      ...params,
    }),
    signal,
  });
  return readResult(res);
}

export async function requestEdit(
  config: ProviderConfig,
  prompt: string,
  image: Blob,
  params: GenerateParams,
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const formData = new FormData();
  appendCredentials(formData, config, prompt);
  appendParams(formData, params);
  formData.append("image", image, "image.png");

  const res = await fetch("/api/edit", { method: "POST", body: formData, signal });
  return readResult(res);
}

export async function requestGenerateWithRefs(
  config: ProviderConfig,
  prompt: string,
  files: File[],
  params: GenerateParams,
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const formData = new FormData();
  appendCredentials(formData, config, prompt);
  appendParams(formData, params);
  for (const file of files) {
    formData.append("image[]", file, file.name);
  }

  const res = await fetch("/api/edit", { method: "POST", body: formData, signal });
  return readResult(res);
}
