// ---- Session ----
export type SessionType = "generate" | "edit";

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  providerId: string;
  modelId: string;
  type?: SessionType;
  sourceImageId?: string;
}

// ---- Message ----
export type MessageRole = "user" | "assistant" | "error";
export type MessageType = "generate" | "edit";
export type MessageStatus = "pending" | "generating" | "done" | "error";

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  images?: ImageResult[];
  sourceImage?: string;
  attachments?: Attachment[];
  params?: GenerateParams;
  createdAt: number;
  status: MessageStatus;
}

// ---- Attachment ----
export interface Attachment {
  id: string;
  name: string;
  type: "image" | "file";
  mimeType: string;
  size: number;
}

export interface ImageInput {
  base64DataUrl: string; // "data:image/png;base64,..."
}

// ---- Image ----
export interface ImageResult {
  id: string;
  b64Data?: string;
  revisedPrompt?: string;
  localBlobUrl?: string;
}

// ---- Generate Params ----
export type ImageComplexity = "auto" | "low" | "medium" | "high";
export type ImageOutputFormat = "png" | "jpeg" | "webp" | "gif";
export type ModerationLevel = "auto" | "low";

export interface GenerateParams {
  model: string;
  size: string;
  quality: string;
  n: number;
  /** 规划开销，仅部分模型支持 */
  complexity?: ImageComplexity;
  /** 输出格式；gif 时配合 frameCount / frameDurationMs */
  outputFormat?: ImageOutputFormat;
  /** GIF 帧数，2–16 */
  frameCount?: number;
  /** 每帧时长（毫秒），20–2000 */
  frameDurationMs?: number;
  /** 透明背景，true 时映射为 background: transparent */
  transparent?: boolean;
  /** 内容审核强度 */
  moderation?: ModerationLevel;
}

// ---- Provider ----
export interface Model {
  id: string;
  name: string;
}

export type ConnectionStatus = "unknown" | "connected" | "error";

export interface ProviderConfig {
  id: string;
  providerType: string;
  displayName: string;
  apiKey: string;
  baseUrl: string;
  defaultParams: GenerateParams;
  /** 「测试连接」从 /models 拉到的可用模型，空则用 provider 内置列表 */
  availableModels?: Model[];
  connectionStatus: ConnectionStatus;
  connectionError?: string;
}

export type GenerateOptions = GenerateParams;

export interface GenerateResult {
  images: { id: string; b64Json: string; revisedPrompt?: string }[];
}

export interface ImageProvider {
  id: string;
  name: string;
  icon: string;
  models: Model[];
  defaultModel: string;
  supportedSizes: string[];
  supportedQualities: string[];
  maxN: number;
  /** 列出服务商可用模型；不支持动态发现时可省略 */
  listModels?(config: ProviderConfig): Promise<Model[]>;
  generate(
    prompt: string,
    options: GenerateOptions,
    config: ProviderConfig,
    signal?: AbortSignal,
  ): Promise<GenerateResult>;
  edit?(
    prompt: string,
    image: Blob,
    options: GenerateOptions,
    config: ProviderConfig,
    signal?: AbortSignal,
  ): Promise<GenerateResult>;
  generateWithRefs?(
    prompt: string,
    referenceImages: ImageInput[],
    options: GenerateOptions,
    config: ProviderConfig,
    signal?: AbortSignal,
  ): Promise<GenerateResult>;
  testConnection(config: ProviderConfig): Promise<boolean>;
}
