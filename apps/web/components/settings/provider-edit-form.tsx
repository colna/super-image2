"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { ProviderConfig } from "@super-image/utils";
import { Button, Card, Input, Space, Typography } from "antd";
import { useCallback, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";

const { Text } = Typography;

interface ProviderEditFormProps {
  config: ProviderConfig;
  onClose: () => void;
}

export function ProviderEditForm({ config, onClose }: ProviderEditFormProps) {
  const { updateProviderField, updateConnectionStatus, setAvailableModels } =
    useSettingsStore();
  const providerDef = getProvider(config.providerType);
  const { t } = useI18n();

  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = useCallback(async () => {
    if (!config.apiKey) return;
    setTesting(true);

    try {
      // 走同源 API 路由：浏览器直连中转常被 CORS 拦截（预检 403 / 无 ACAO）
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: config.providerType,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        models?: { id: string; name: string }[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? t("editProvider.connectionFailed"));
      }

      if (data.ok) {
        setAvailableModels(config.id, data.models ?? []);
        updateConnectionStatus(config.id, "connected");
      } else {
        updateConnectionStatus(config.id, "error", t("editProvider.connectionFailed"));
      }
    } catch (err) {
      updateConnectionStatus(
        config.id,
        "error",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setTesting(false);
    }
  }, [config, updateConnectionStatus, setAvailableModels, t]);

  if (!providerDef) return null;

  return (
    <Card
      size="small"
      title={t("editProvider.title", { name: config.displayName })}
      extra={
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Display Name */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>
            {t("editProvider.displayName")}
          </Text>
          <Input
            value={config.displayName}
            onChange={(e) => updateProviderField(config.id, "displayName", e.target.value)}
            placeholder={t("editProvider.placeholder")}
          />
        </div>

        {/* API Key */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>
            {t("editProvider.apiKey")}
          </Text>
          <Input
            type={showApiKey ? "text" : "password"}
            value={config.apiKey}
            onChange={(e) => updateProviderField(config.id, "apiKey", e.target.value)}
            placeholder="sk-..."
            suffix={
              <Button
                type="text"
                size="small"
                icon={showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ width: 24, height: 24, minWidth: 24 }}
              />
            }
          />
        </div>

        {/* Base URL */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>
            {t("editProvider.baseUrl")}
          </Text>
          <Input
            value={config.baseUrl}
            onChange={(e) => updateProviderField(config.id, "baseUrl", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        {/* Connection status */}
        {config.connectionStatus === "connected" && (
          <Space style={{ color: "#52c41a", fontSize: 12 }}>
            <CheckCircleOutlined />
            <span>
              {config.availableModels?.length
                ? t("editProvider.connectedWithModels", {
                    count: config.availableModels.length,
                  })
                : t("editProvider.connected")}
            </span>
          </Space>
        )}
        {config.connectionStatus === "error" && (
          <Space style={{ color: "#ff4d4f", fontSize: 12 }}>
            <CloseCircleOutlined />
            <span>{config.connectionError ?? t("editProvider.connectionFailed")}</span>
          </Space>
        )}

        {/* Test button */}
        <Button
          block
          onClick={handleTestConnection}
          disabled={!config.apiKey || testing}
          icon={testing ? <LoadingOutlined /> : undefined}
        >
          {testing ? t("editProvider.testing") : t("editProvider.testConnection")}
        </Button>
      </div>
    </Card>
  );
}
