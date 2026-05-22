"use client";

import type { Message } from "@super-image/utils";
import { Typography } from "antd";
import { useState } from "react";

import { ErrorState } from "@/components/error-state";
import { ImageCard } from "@/components/image-card";
import { ImageSkeleton } from "@/components/image-skeleton";
import { Lightbox } from "@/components/lightbox";
import { useI18n } from "@/lib/i18n";

const { Text } = Typography;

interface AIMessageProps {
  message: Message;
  onRetry?: () => void;
  onCancel?: () => void;
  onEdit?: (imageId: string) => void;
}

export function AIMessage({ message, onRetry, onCancel, onEdit }: AIMessageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { t } = useI18n();
  const isGenerating = message.status === "generating";
  const isError = message.status === "error";
  const isDone = message.status === "done";

  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div style={{ maxWidth: "80%" }}>
        <div
          style={{
            borderRadius: 12,
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            padding: "12px 16px",
          }}
        >
          {isGenerating && (
            <ImageSkeleton size={message.params?.size ?? "1024x1024"} onCancel={onCancel} />
          )}

          {isError && <ErrorState message={message.content} onRetry={onRetry} />}

          {isDone && message.images && message.images.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns: message.images.length > 1 ? "1fr 1fr" : "1fr",
                maxWidth: message.images.length > 1 ? 520 : 360,
              }}
            >
              {message.images.map((img, idx) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onClick={() => setLightboxIndex(idx)}
                  onEdit={onEdit ? () => onEdit(img.id) : undefined}
                />
              ))}
            </div>
          )}

          {lightboxIndex !== null && message.images && (
            <Lightbox
              images={message.images}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}

          {isDone && message.images?.some((img) => img.revisedPrompt) && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: "pointer", fontSize: 12, color: "#999" }}>
                {t("ai.viewRevised")}
              </summary>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                {message.images?.find((img) => img.revisedPrompt)?.revisedPrompt}
              </Text>
            </details>
          )}
        </div>
        <div style={{ marginTop: 4, fontSize: 10, color: "#bbb" }}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
