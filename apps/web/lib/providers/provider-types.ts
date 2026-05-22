export interface ProviderTypeMeta {
  type: string;
  label: string;
  icon: string;
  defaultBaseUrl: string;
  defaultModel: string;
}

export const PROVIDER_TYPES: ProviderTypeMeta[] = [
  {
    type: "openai",
    label: "OpenAI",
    icon: "🤖",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-image-1",
  },
];
