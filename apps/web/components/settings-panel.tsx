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
import { useCallback, useEffect, useState } from "react";

import { getAllProviders, getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";
import { useUIStore } from "@/stores/ui-store";

type ConnectionStatus = "idle" | "testing" | "success" | "error";

export function SettingsPanel() {
  const { settingsPanelOpen, setSettingsPanelOpen } = useUIStore();
  const {
    providers,
    activeProviderId,
    setActiveProviderId,
    updateProviderField,
  } = useSettingsStore();

  const activeConfig = providers[activeProviderId];
  const providerDef = getProvider(activeProviderId);
  const allProviders = getAllProviders();

  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionError, setConnectionError] = useState("");

  // Auto-hide connection status after success
  useEffect(() => {
    if (connectionStatus === "success") {
      const timer = setTimeout(() => setConnectionStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
  }, [connectionStatus]);

  const handleTestConnection = useCallback(async () => {
    if (!activeConfig?.apiKey) return;
    setConnectionStatus("testing");
    setConnectionError("");

    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: activeProviderId,
          apiKey: activeConfig.apiKey,
          baseUrl: activeConfig.baseUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setConnectionStatus("success");
      } else {
        setConnectionStatus("error");
        setConnectionError(data.error ?? "Connection failed");
      }
    } catch {
      setConnectionStatus("error");
      setConnectionError("Network error");
    }
  }, [activeConfig, activeProviderId]);

  if (!activeConfig || !providerDef) return null;

  return (
    <>
      {/* Backdrop */}
      {settingsPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setSettingsPanelOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full border-l border-border bg-background transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:w-80 ${
          settingsPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Settings</h2>
            <button
              onClick={() => setSettingsPanelOpen(false)}
              className="rounded-card p-1 text-foreground-secondary hover:bg-background-hover"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Provider */}
          <label className="mb-1.5 text-xs font-medium text-foreground-secondary">
            Provider
          </label>
          <Select
            value={activeProviderId}
            onValueChange={setActiveProviderId}
          >
            <SelectTrigger className="mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allProviders.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* API Key */}
          <label className="mb-1.5 text-xs font-medium text-foreground-secondary">
            API Key
          </label>
          <div className="relative mb-4">
            <Input
              type={showApiKey ? "text" : "password"}
              value={activeConfig.apiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateProviderField(activeProviderId, "apiKey", e.target.value)
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

          {/* Base URL */}
          <label className="mb-1.5 text-xs font-medium text-foreground-secondary">
            Base URL
          </label>
          <Input
            value={activeConfig.baseUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateProviderField(activeProviderId, "baseUrl", e.target.value)
            }
            placeholder="https://api.openai.com/v1"
            className="mb-4"
          />

          {/* Model */}
          <label className="mb-1.5 text-xs font-medium text-foreground-secondary">
            Model
          </label>
          <Select
            value={activeConfig.defaultModel}
            onValueChange={(v) =>
              updateProviderField(activeProviderId, "defaultModel", v)
            }
          >
            <SelectTrigger className="mb-4">
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

          {/* Default params separator */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-foreground-secondary">Default Params</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Size */}
          <label className="mb-1.5 text-xs font-medium text-foreground-secondary">
            Size
          </label>
          <Select
            value={activeConfig.defaultParams.size}
            onValueChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...activeConfig.defaultParams,
                size: v,
              })
            }
          >
            <SelectTrigger className="mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerDef.supportedSizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quality */}
          <label className="mb-1.5 text-xs font-medium text-foreground-secondary">
            Quality
          </label>
          <Select
            value={activeConfig.defaultParams.quality}
            onValueChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...activeConfig.defaultParams,
                quality: v,
              })
            }
          >
            <SelectTrigger className="mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerDef.supportedQualities.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* N (count) */}
          <label className="mb-1.5 text-xs font-medium text-foreground-secondary">
            Count
          </label>
          <Select
            value={String(activeConfig.defaultParams.n)}
            onValueChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...activeConfig.defaultParams,
                n: parseInt(v, 10),
              })
            }
          >
            <SelectTrigger className="mb-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: providerDef.maxN }, (_, i) => i + 1).map(
                (n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          {/* Connection status */}
          {connectionStatus === "success" && (
            <div className="mb-4 flex items-center gap-2 text-sm text-green-600">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8L7 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Connected successfully
            </div>
          )}
          {connectionStatus === "error" && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {connectionError}
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto flex gap-3">
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              disabled={!activeConfig.apiKey || connectionStatus === "testing"}
              className="flex-1"
            >
              {connectionStatus === "testing" ? (
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
        </div>
      </div>
    </>
  );
}
