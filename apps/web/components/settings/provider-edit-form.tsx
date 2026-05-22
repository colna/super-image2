"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@super-image/ui";
import type { ProviderConfig } from "@super-image/utils";
import { useCallback, useState } from "react";

import { getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";

interface ProviderEditFormProps {
  config: ProviderConfig;
  onClose: () => void;
}

export function ProviderEditForm({ config, onClose }: ProviderEditFormProps) {
  const { updateProviderField, updateConnectionStatus } = useSettingsStore();
  const providerDef = getProvider(config.providerType);

  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = useCallback(async () => {
    if (!config.apiKey) return;
    setTesting(true);

    try {
      const provider = getProvider(config.providerType);
      if (!provider) {
        updateConnectionStatus(config.id, "error", "Provider not found");
        return;
      }
      const ok = await provider.testConnection(config);
      updateConnectionStatus(config.id, ok ? "connected" : "error", ok ? undefined : "Connection failed");
    } catch (err) {
      updateConnectionStatus(
        config.id,
        "error",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setTesting(false);
    }
  }, [config, updateConnectionStatus]);

  if (!providerDef) return null;

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-background-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Edit: {config.displayName}
        </h3>
        <button
          onClick={onClose}
          className="rounded-card p-1 text-foreground-secondary hover:bg-background-hover"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Display Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground-secondary">
          Display Name
        </label>
        <Input
          value={config.displayName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateProviderField(config.id, "displayName", e.target.value)
          }
          placeholder="My Provider"
        />
      </div>

      {/* API Key */}
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground-secondary">
          API Key
        </label>
        <div className="relative">
          <Input
            type={showApiKey ? "text" : "password"}
            value={config.apiKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateProviderField(config.id, "apiKey", e.target.value)
            }
            placeholder="sk-..."
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground-secondary hover:text-foreground"
          >
            {showApiKey ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2L14 14M6.5 6.5a2 2 0 002.8 2.8M3 8s2-4 5-4c.8 0 1.5.2 2.1.5M13 8s-2 4-5 4c-.8 0-1.5-.2-2.1-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 4C5 4 3 8 3 8s2 4 5 4 5-4 5-4-2-4-5-4z" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Base URL */}
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground-secondary">
          Base URL
        </label>
        <Input
          value={config.baseUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateProviderField(config.id, "baseUrl", e.target.value)
          }
          placeholder="https://api.openai.com/v1"
        />
      </div>

      {/* Model */}
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground-secondary">
          Model
        </label>
        <Select
          value={config.defaultModel}
          onValueChange={(v) =>
            updateProviderField(config.id, "defaultModel", v)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providerDef.models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Connection status */}
      {config.connectionStatus === "connected" && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Connected
        </div>
      )}
      {config.connectionStatus === "error" && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {config.connectionError ?? "Connection failed"}
        </div>
      )}

      {/* Actions */}
      <Button
        variant="secondary"
        onClick={handleTestConnection}
        disabled={!config.apiKey || testing}
        className="w-full"
      >
        {testing ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Testing...
          </span>
        ) : (
          "Test Connection"
        )}
      </Button>
    </div>
  );
}
