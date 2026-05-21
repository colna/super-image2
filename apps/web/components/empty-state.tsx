"use client";

import { Button } from "@super-image/ui";

import { useSettingsStore } from "@/stores/settings-store";
import { useUIStore } from "@/stores/ui-store";

const EXAMPLE_PROMPTS = [
  "A serene Japanese garden with cherry blossoms at sunset",
  "An astronaut riding a horse on Mars, digital art",
  "A cozy coffee shop interior with warm lighting, watercolor style",
  "A futuristic city skyline with flying cars at night",
];

interface EmptyStateProps {
  onPromptClick: (prompt: string) => void;
}

export function EmptyState({ onPromptClick }: EmptyStateProps) {
  const { providers, activeProviderId } = useSettingsStore();
  const { setSettingsPanelOpen } = useUIStore();
  const config = providers[activeProviderId];
  const hasApiKey = !!config?.apiKey;

  if (!hasApiKey) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background-hover">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground-secondary">
              <path d="M12 15v-3M12 9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Configure API Key
          </h2>
          <p className="mb-4 text-sm text-foreground-secondary">
            Add your OpenAI API key to start generating images
          </p>
          <Button onClick={() => setSettingsPanelOpen(true)}>
            Open Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-lg">
        <h2 className="mb-2 text-center text-lg font-medium text-foreground">
          SuperImage
        </h2>
        <p className="mb-6 text-center text-sm text-foreground-secondary">
          Describe the image you want to create
        </p>
        <div className="grid grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onPromptClick(prompt)}
              className="rounded-card border border-border bg-background-card p-3 text-left text-xs text-foreground-secondary hover:border-foreground/20 hover:text-foreground transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
