"use client";

import { LoadingOutlined } from "@ant-design/icons";
import { Button, Spin } from "antd";

import { useI18n } from "@/lib/i18n";

interface ImageSkeletonProps {
  size: string;
  onCancel?: () => void;
}

function getAspectRatio(size: string): number {
  if (size === "1024x1536" || size === "auto") return 2 / 3;
  if (size === "1536x1024") return 3 / 2;
  return 1;
}

export function ImageSkeleton({ size, onCancel }: ImageSkeletonProps) {
  const ratio = getAspectRatio(size);
  const { t } = useI18n();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 300,
          aspectRatio: ratio,
          borderRadius: 8,
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#999" }}>{t("skeleton.generating")}</span>
        {onCancel && (
          <Button size="small" onClick={onCancel}>{t("skeleton.cancel")}</Button>
        )}
      </div>
    </div>
  );
}
