"use client";

import {
  CloseOutlined,
  DownOutlined,
  FileOutlined,
  PaperClipOutlined,
  SendOutlined,
  UpOutlined,
} from "@ant-design/icons";
import type { GenerateParams, ImageOutputFormat } from "@super-image/utils";
import { Button, InputNumber, Popover, Select, Space } from "antd";
import { useCallback, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";

interface ChatInputProps {
  onSend: (
    prompt: string,
    params: GenerateParams,
    attachments?: File[],
  ) => void;
  disabled?: boolean;
}

const MAX_FILES = 5;

const PILL_STYLE: React.CSSProperties = {
  background: "#f5f5f5",
  border: "none",
  borderRadius: 8,
  height: 32,
  display: "flex",
  alignItems: "center",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: "#888",
  width: 92,
  flexShrink: 0,
};

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const { providers, activeProviderId, updateProviderField } = useSettingsStore();
  const config = providers[activeProviderId];
  const providerDef = getProvider(config?.providerType ?? activeProviderId);
  const params = config?.defaultParams;

  const updateParams = useCallback(
    (patch: Partial<GenerateParams>) => {
      if (!config) return;
      updateProviderField(activeProviderId, "defaultParams", {
        ...config.defaultParams,
        ...patch,
      });
    },
    [config, activeProviderId, updateProviderField],
  );

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

  const modelOptions = useMemo(() => {
    const discovered = config?.availableModels ?? [];
    const fallback = providerDef?.models ?? [];
    const list = discovered.length > 0 ? discovered : fallback;
    if (params?.model && !list.some((m) => m.id === params.model)) {
      return [{ id: params.model, name: params.model }, ...list];
    }
    return list;
  }, [config?.availableModels, providerDef?.models, params?.model]);

  const isGif = params?.outputFormat === "gif";

  const advancedSummary = useMemo(() => {
    if (!params) return "";
    const parts = [
      `${t("chat.complexity")} ${params.complexity ?? "auto"}`,
    ];
    if (isGif) {
      parts.push(
        `${(params.outputFormat ?? "png").toUpperCase()} · ${params.frameCount ?? 9} ${t("chat.frameUnit")}`,
      );
    } else {
      parts.push((params.outputFormat ?? "png").toUpperCase());
    }
    parts.push(`${t("chat.transparent")} ${String(params.transparent ?? false)}`);
    parts.push(`${t("chat.moderation")} ${params.moderation ?? "auto"}`);
    return parts.join(" · ");
  }, [params, isGif, t]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (!params) return;
    onSend(trimmed, params, files.length > 0 ? files : undefined);
    setValue("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, onSend, params, files]);

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

  if (!config || !providerDef || !params) return null;

  const advancedPanel = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 4, width: 300 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={LABEL_STYLE}>{t("chat.complexity")}</span>
        <Select
          aria-label={t("chat.complexity")}
          value={params.complexity ?? "auto"}
          onChange={(v) => updateParams({ complexity: v })}
          variant="borderless"
          style={{ ...PILL_STYLE, flex: 1 }}
          options={["auto", "low", "medium", "high"].map((v) => ({
            label: v,
            value: v,
          }))}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={LABEL_STYLE}>{t("chat.format")}</span>
        <Select<ImageOutputFormat>
          aria-label={t("chat.format")}
          value={params.outputFormat ?? "png"}
          onChange={(v) => updateParams({ outputFormat: v })}
          variant="borderless"
          style={{ ...PILL_STYLE, flex: 1 }}
          options={["png", "jpeg", "webp", "gif"].map((v) => ({
            label: v.toUpperCase(),
            value: v,
          }))}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ ...LABEL_STYLE, opacity: isGif ? 1 : 0.45 }}>
          {t("chat.frameCount")}
        </span>
        <InputNumber
          aria-label={t("chat.frameCount")}
          min={2}
          max={16}
          precision={0}
          disabled={!isGif}
          value={params.frameCount ?? 9}
          onChange={(v) => updateParams({ frameCount: v ?? 9 })}
          variant="borderless"
          style={{ ...PILL_STYLE, flex: 1, width: "100%" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ ...LABEL_STYLE, opacity: isGif ? 1 : 0.45 }}>
          {t("chat.frameDuration")}
        </span>
        <InputNumber
          aria-label={t("chat.frameDuration")}
          min={20}
          max={2000}
          step={10}
          precision={0}
          disabled={!isGif}
          value={params.frameDurationMs ?? 200}
          onChange={(v) => updateParams({ frameDurationMs: v ?? 200 })}
          variant="borderless"
          style={{ ...PILL_STYLE, flex: 1, width: "100%" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={LABEL_STYLE}>{t("chat.transparent")}</span>
        <Select
          aria-label={t("chat.transparent")}
          value={params.transparent ?? false}
          onChange={(v) => updateParams({ transparent: v })}
          variant="borderless"
          style={{ ...PILL_STYLE, flex: 1 }}
          options={[
            { label: "false", value: false },
            { label: "true", value: true },
          ]}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={LABEL_STYLE}>{t("chat.moderation")}</span>
        <Select
          aria-label={t("chat.moderation")}
          value={params.moderation ?? "auto"}
          onChange={(v) => updateParams({ moderation: v })}
          variant="borderless"
          style={{ ...PILL_STYLE, flex: 1 }}
          options={["auto", "low"].map((v) => ({ label: v, value: v }))}
        />
      </div>
    </div>
  );

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
          <span style={{ fontSize: 12, color: "#888" }}>{t("chat.model")}</span>
          <Select
            aria-label={t("chat.model")}
            value={params.model}
            onChange={(v) => updateParams({ model: v })}
            size="small"
            style={{ minWidth: 180 }}
            showSearch
            optionFilterProp="label"
            options={modelOptions.map((m) => ({ label: m.name, value: m.id }))}
          />
        </Space>

        <Space size={4} align="center">
          <span style={{ fontSize: 12, color: "#888" }}>{t("chat.size")}</span>
          <Select
            aria-label={t("chat.size")}
            value={params.size}
            onChange={(v) => updateParams({ size: v })}
            size="small"
            style={{ minWidth: 110 }}
            options={providerDef.supportedSizes.map((s) => ({ label: s, value: s }))}
          />
        </Space>

        <Space size={4} align="center">
          <span style={{ fontSize: 12, color: "#888" }}>{t("chat.quality")}</span>
          <Select
            aria-label={t("chat.quality")}
            value={params.quality}
            onChange={(v) => updateParams({ quality: v })}
            size="small"
            style={{ minWidth: 90 }}
            options={providerDef.supportedQualities.map((q) => ({ label: q, value: q }))}
          />
        </Space>

        <Space size={4} align="center">
          <span style={{ fontSize: 12, color: "#888" }}>{t("chat.n")}</span>
          <Select
            aria-label={t("chat.n")}
            value={params.n}
            onChange={(v) => updateParams({ n: v })}
            size="small"
            style={{ minWidth: 56 }}
            options={Array.from({ length: providerDef.maxN }, (_, i) => ({
              label: String(i + 1),
              value: i + 1,
            }))}
          />
        </Space>
      </Space>

      {/* Advanced params summary */}
      <Popover
        content={advancedPanel}
        trigger="click"
        placement="topLeft"
        arrow={false}
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
      >
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            maxWidth: "100%",
            padding: "4px 10px",
            marginBottom: 8,
            fontSize: 12,
            color: "#666",
            background: "#fafafa",
            border: "1px solid #ededed",
            borderRadius: 999,
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <span style={{ fontWeight: 500, color: "#1a1a1a" }}>
            {t("chat.more")}
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            · {advancedSummary}
          </span>
          {advancedOpen ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
        </button>
      </Popover>

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
