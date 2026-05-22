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
  params?: GenerateParams;
  createdAt: number;
  status: MessageStatus;
}

// ---- Image ----
export interface ImageResult {
  id: string;
  b64Data?: string;
  revisedPrompt?: string;
  localBlobUrl?: string;
}

// ---- Generate Params ----
export interface GenerateParams {
  model: string;
  size: string;
  quality: string;
  n: number;
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
  defaultModel: string;
  defaultParams: GenerateParams;
  connectionStatus: ConnectionStatus;
  connectionError?: string;
}

export interface GenerateOptions {
  model: string;
  size: string;
  quality: string;
  n: number;
}

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
  testConnection(config: ProviderConfig): Promise<boolean>;
}
