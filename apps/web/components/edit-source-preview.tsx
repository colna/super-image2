"use client";

import { EditOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Alert, Spin, Typography } from "antd";
import { useEffect, useState } from "react";

import { ImagePreview } from "@/components/image-preview";
import { getImage } from "@/lib/db";
import { useI18n } from "@/lib/i18n";

const { Text } = Typography;

interface EditSourcePreviewProps {
  imageId: string;
}

export function EditSourcePreview({ imageId }: EditSourcePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    let url: string | null = null;
    async function load() {
      const stored = await getImage(imageId);
      if (stored) {
        url = URL.createObjectURL(stored.blob);
        setBlobUrl(url);
      }
    }
    load();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [imageId]);

  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e8e8e8", background: "#fafafa" }}>
      <div style={{ maxWidth: 768, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <EditOutlined style={{ fontSize: 14, color: "#888" }} />
          <Text strong style={{ fontSize: 13 }}>{t("edit.sourceTitle")}</Text>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {blobUrl ? (
            <ImagePreview src={blobUrl} alt="Source image">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL */}
              <img
                src={blobUrl}
                alt="Source image"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #e8e8e8",
                  flexShrink: 0,
                }}
              />
            </ImagePreview>
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                background: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Spin size="small" />
            </div>
          )}
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message={t("edit.sourceWarning")}
            style={{ flex: 1, fontSize: 12 }}
          />
        </div>
      </div>
    </div>
  );
}
