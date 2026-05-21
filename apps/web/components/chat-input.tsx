"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@super-image/ui";
import { useCallback, useRef, useState } from "react";

import { getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";

interface ChatInputProps {
  onSend: (prompt: string, params: { size: string; quality: string; n: number }) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { providers, activeProviderId, updateProviderField } = useSettingsStore();
  const config = providers[activeProviderId];
  const providerDef = getProvider(activeProviderId);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onSend(trimmed, {
      size: config?.defaultParams.size ?? "1024x1024",
      quality: config?.defaultParams.quality ?? "auto",
      n: config?.defaultParams.n ?? 1,
    });
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, onSend, config]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!disabled) handleSend();
      }
    },
    [disabled, handleSend],
  );

  if (!config || !providerDef) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background p-4">
      {/* Quick params bar */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground-secondary">Size</span>
          <Select
            value={config.defaultParams.size}
            onValueChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...config.defaultParams,
                size: v,
              })
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-[100px] px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerDef.supportedSizes.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground-secondary">Quality</span>
          <Select
            value={config.defaultParams.quality}
            onValueChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...config.defaultParams,
                quality: v,
              })
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-[80px] px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providerDef.supportedQualities.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground-secondary">N</span>
          <Select
            value={String(config.defaultParams.n)}
            onValueChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...config.defaultParams,
                n: parseInt(v, 10),
              })
            }
          >
            <SelectTrigger className="h-7 w-auto min-w-[48px] px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: providerDef.maxN }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Input area */}
      <div
        className={`flex items-end gap-2 rounded-bubble border border-border bg-background-card p-2 transition-all ${
          shake ? "animate-shake" : ""
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Generating..." : "Describe the image you want to create..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-foreground-placeholder focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{ minHeight: "36px", maxHeight: "160px" }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={`shrink-0 rounded-card p-2 transition-colors ${
            value.trim() && !disabled
              ? "bg-foreground text-white hover:bg-foreground/90"
              : "bg-border text-foreground-secondary cursor-not-allowed"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 14l12-6L2 2v4.67L10 8 2 9.33V14z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
