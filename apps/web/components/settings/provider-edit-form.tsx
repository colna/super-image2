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
import { Button, Card, Input, Select, Space, Typography } from "antd";
import { useCallback, useState } from "react";

import { getProvider } from "@/lib/providers";
import { useSettingsStore } from "@/stores/settings-store";

const { Text } = Typography;

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
    <Card
      size="small"
      title={`Edit: ${config.displayName}`}
      extra={
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Display Name */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>
            Display Name
          </Text>
          <Input
            value={config.displayName}
            onChange={(e) => updateProviderField(config.id, "displayName", e.target.value)}
            placeholder="My Provider"
          />
        </div>

        {/* API Key */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>
            API Key
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
            Base URL
          </Text>
          <Input
            value={config.baseUrl}
            onChange={(e) => updateProviderField(config.id, "baseUrl", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        {/* Model */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>
            Model
          </Text>
          <Select
            value={config.defaultModel}
            onChange={(v) => updateProviderField(config.id, "defaultModel", v)}
            style={{ width: "100%" }}
            options={providerDef.models.map((m) => ({ label: m.name, value: m.id }))}
          />
        </div>

        {/* Connection status */}
        {config.connectionStatus === "connected" && (
          <Space style={{ color: "#52c41a", fontSize: 12 }}>
            <CheckCircleOutlined />
            <span>Connected</span>
          </Space>
        )}
        {config.connectionStatus === "error" && (
          <Space style={{ color: "#ff4d4f", fontSize: 12 }}>
            <CloseCircleOutlined />
            <span>{config.connectionError ?? "Connection failed"}</span>
          </Space>
        )}

        {/* Test button */}
        <Button
          block
          onClick={handleTestConnection}
          disabled={!config.apiKey || testing}
          icon={testing ? <LoadingOutlined /> : undefined}
        >
          {testing ? "Testing..." : "Test Connection"}
        </Button>
      </div>
    </Card>
  );
}
