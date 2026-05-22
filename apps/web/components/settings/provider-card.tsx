"use client";

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ProviderConfig } from "@super-image/utils";
import { Badge, Button, Radio, Typography } from "antd";

import { PROVIDER_TYPES } from "@/lib/providers/provider-types";

const { Text } = Typography;

interface ProviderCardProps {
  config: ProviderConfig;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  connected: "#52c41a",
  error: "#ff4d4f",
  unknown: "#d9d9d9",
};

export function ProviderCard({
  config,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: ProviderCardProps) {
  const meta = PROVIDER_TYPES.find((t) => t.type === config.providerType);

  return (
    <div
      className="provider-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 8,
        border: `1px solid ${isActive ? "#1a1a1a" : "#e8e8e8"}`,
        background: isActive ? "#fafafa" : "#fff",
        padding: 12,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={onSelect}
    >
      {/* Radio */}
      <Radio checked={isActive} onClick={(e) => e.stopPropagation()} />

      {/* Status dot */}
      <Badge
        color={STATUS_COLOR[config.connectionStatus] ?? STATUS_COLOR.unknown}
        title={config.connectionStatus}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13, display: "block" }} ellipsis>
          {config.displayName}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
          {meta?.icon} {meta?.label ?? config.providerType}
        </Text>
      </div>

      {/* Actions */}
      <div className="provider-card-actions" style={{ display: "flex", gap: 2 }}>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined style={{ fontSize: 12 }} />}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          aria-label="Edit"
        />
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined style={{ fontSize: 12 }} />}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete"
        />
      </div>
    </div>
  );
}
