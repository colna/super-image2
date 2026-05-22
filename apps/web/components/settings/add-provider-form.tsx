"use client";

import { CloseOutlined } from "@ant-design/icons";
import { Button, Card, Input, Typography } from "antd";
import { useState } from "react";

import { useI18n } from "@/lib/i18n";
import { PROVIDER_TYPES } from "@/lib/providers/provider-types";
import { useSettingsStore } from "@/stores/settings-store";

const { Text } = Typography;

interface AddProviderFormProps {
  onClose: () => void;
  onAdded: (id: string) => void;
}

export function AddProviderForm({ onClose, onAdded }: AddProviderFormProps) {
  const [selectedType, setSelectedType] = useState(PROVIDER_TYPES[0].type);
  const [name, setName] = useState("");
  const { addProvider } = useSettingsStore();
  const { t } = useI18n();

  const meta = PROVIDER_TYPES.find((pt) => pt.type === selectedType);

  const handleAdd = () => {
    const displayName = name.trim() || meta?.label || selectedType;
    const id = addProvider(selectedType, displayName);
    onAdded(id);
  };

  return (
    <Card
      size="small"
      title={t("addProvider.title")}
      extra={
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Provider type */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
            {t("addProvider.type")}
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PROVIDER_TYPES.map((pt) => (
              <div
                key={pt.type}
                onClick={() => setSelectedType(pt.type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 8,
                  border: `1px solid ${selectedType === pt.type ? "#1a1a1a" : "#e8e8e8"}`,
                  background: selectedType === pt.type ? "#fafafa" : undefined,
                  padding: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
              >
                <span>{pt.icon}</span>
                <span style={{ fontWeight: 500 }}>{pt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Display name */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 6 }}>
            {t("addProvider.displayName")}
          </Text>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={meta?.label ?? t("addProvider.placeholder")}
          />
        </div>

        <Button type="primary" block onClick={handleAdd}>
          {t("addProvider.submit")}
        </Button>
      </div>
    </Card>
  );
}
