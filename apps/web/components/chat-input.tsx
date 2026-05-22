"use client";

import { SendOutlined } from "@ant-design/icons";
import { Button, Select, Space } from "antd";
import { useCallback, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();

  const { providers, activeProviderId, updateProviderField } = useSettingsStore();
  const config = providers[activeProviderId];
  const providerDef = getProvider(config?.providerType ?? activeProviderId);

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
    <div style={{ flexShrink: 0, borderTop: "1px solid #e8e8e8", background: "#fff", padding: 16 }}>
      {/* Quick params bar */}
      <Space wrap size={12} style={{ marginBottom: 8 }}>
        <Space size={4} align="center">
          <span style={{ fontSize: 12, color: "#888" }}>{t("chat.size")}</span>
          <Select
            value={config.defaultParams.size}
            onChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...config.defaultParams,
                size: v,
              })
            }
            size="small"
            style={{ minWidth: 110 }}
            options={providerDef.supportedSizes.map((s) => ({ label: s, value: s }))}
          />
        </Space>

        <Space size={4} align="center">
          <span style={{ fontSize: 12, color: "#888" }}>{t("chat.quality")}</span>
          <Select
            value={config.defaultParams.quality}
            onChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...config.defaultParams,
                quality: v,
              })
            }
            size="small"
            style={{ minWidth: 90 }}
            options={providerDef.supportedQualities.map((q) => ({ label: q, value: q }))}
          />
        </Space>

        <Space size={4} align="center">
          <span style={{ fontSize: 12, color: "#888" }}>{t("chat.n")}</span>
          <Select
            value={config.defaultParams.n}
            onChange={(v) =>
              updateProviderField(activeProviderId, "defaultParams", {
                ...config.defaultParams,
                n: v,
              })
            }
            size="small"
            style={{ minWidth: 56 }}
            options={Array.from({ length: providerDef.maxN }, (_, i) => ({
              label: String(i + 1),
              value: i + 1,
            }))}
          />
        </Space>
      </Space>

      {/* Input area */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          borderRadius: 12,
          border: "1px solid #e8e8e8",
          background: "#fafafa",
          padding: 8,
          transition: "all 0.2s",
          animation: shake ? "shake 0.5s ease-in-out" : undefined,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? t("chat.placeholderGenerating") : t("chat.placeholder")}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "transparent",
            fontSize: 14,
            color: "#1a1a1a",
            border: "none",
            outline: "none",
            minHeight: 36,
            maxHeight: 160,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : undefined,
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          size="small"
          shape="circle"
        />
      </div>
    </div>
  );
}
