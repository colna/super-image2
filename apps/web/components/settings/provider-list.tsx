"use client";

import type { ProviderConfig } from "@super-image/utils";
import { Typography } from "antd";

import { useI18n } from "@/lib/i18n";

import { ProviderCard } from "./provider-card";

const { Text } = Typography;

interface ProviderListProps {
  providers: ProviderConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProviderList({
  providers,
  activeId,
  onSelect,
  onEdit,
  onDelete,
}: ProviderListProps) {
  const { t } = useI18n();

  if (providers.length === 0) {
    return (
      <div
        style={{
          borderRadius: 8,
          border: "1px dashed #e8e8e8",
          padding: 16,
          textAlign: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t("settings.noProviders")}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {providers.map((p) => (
        <ProviderCard
          key={p.id}
          config={p}
          isActive={p.id === activeId}
          onSelect={() => onSelect(p.id)}
          onEdit={() => onEdit(p.id)}
          onDelete={() => onDelete(p.id)}
        />
      ))}
    </div>
  );
}
