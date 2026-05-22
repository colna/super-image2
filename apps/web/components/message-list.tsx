"use client";

import type { Message } from "@super-image/utils";
import { Typography } from "antd";
import { useEffect, useRef } from "react";

import { AIMessage } from "@/components/ai-message";
import { UserMessage } from "@/components/user-message";
import { useI18n } from "@/lib/i18n";

const { Title, Paragraph } = Typography;

interface MessageListProps {
  messages: Message[];
  onRetry?: (messageId: string) => void;
  onCancel?: () => void;
  onEdit?: (imageId: string) => void;
}

export function MessageList({ messages, onRetry, onCancel, onEdit }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Title level={4} style={{ marginBottom: 8 }}>
            {t("message.startTitle")}
          </Title>
          <Paragraph type="secondary">
            {t("message.startDesc")}
          </Paragraph>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ maxWidth: 768, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} message={msg} />
          ) : (
            <AIMessage
              key={msg.id}
              message={msg}
              onRetry={() => onRetry?.(msg.id)}
              onCancel={onCancel}
              onEdit={onEdit}
            />
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
