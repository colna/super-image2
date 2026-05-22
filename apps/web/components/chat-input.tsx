"use client";

import { CloseOutlined, FileOutlined, PaperClipOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Select, Space } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";

interface ChatInputProps {
  onSend: (
    prompt: string,
    params: { size: string; quality: string; n: number },
    attachments?: File[],
  ) => void;
  disabled?: boolean;
}

const MAX_FILES = 5;

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => {
      const combined = [...prev, ...arr];
      return combined.slice(0, MAX_FILES);
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const previews = useMemo(
    () => files.map((f) => ({
      name: f.name,
      isImage: f.type.startsWith("image/"),
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
    })),
    [files],
  );

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onSend(
      trimmed,
      {
        size: config?.defaultParams.size ?? "1024x1024",
        quality: config?.defaultParams.quality ?? "auto",
        n: config?.defaultParams.n ?? 1,
      },
      files.length > 0 ? files : undefined,
    );
    setValue("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, onSend, config, files]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!disabled) handleSend();
      }
    },
    [disabled, handleSend],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      addFiles(e.dataTransfer.files);
    },
    [disabled, addFiles],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        addFiles(pastedFiles);
      }
    },
    [addFiles],
  );

  if (!config || !providerDef) return null;

  return (
    <div
      style={{ flexShrink: 0, borderTop: "1px solid #e8e8e8", background: "#fff", padding: 16 }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
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

      {/* Attachment previews */}
      {files.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {previews.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              style={{
                position: "relative",
                width: 64,
                height: 64,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e8e8e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: p.isImage ? undefined : "#f5f5f5",
              }}
            >
              {p.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.url}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 4 }}>
                  <FileOutlined style={{ fontSize: 20, color: "#888" }} />
                  <div style={{ fontSize: 9, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 56 }}>
                    {p.name.split(".").pop()}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  padding: 0,
                }}
              >
                <CloseOutlined />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 12,
          border: `1px solid ${dragOver ? "#1a1a1a" : "#e8e8e8"}`,
          background: dragOver ? "#f0f0f0" : "#fafafa",
          padding: "6px 8px",
          transition: "all 0.2s",
          animation: shake ? "shake 0.5s ease-in-out" : undefined,
        }}
      >
        {/* Clip button */}
        <Button
          type="text"
          size="small"
          icon={<PaperClipOutlined />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= MAX_FILES}
          style={{ width: 32, height: 32, minWidth: 32, color: "#888" }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={disabled ? t("chat.placeholderGenerating") : t("chat.placeholder")}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "transparent",
            fontSize: 14,
            lineHeight: "20px",
            color: "#1a1a1a",
            border: "none",
            outline: "none",
            padding: "6px 0",
            minHeight: 32,
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
