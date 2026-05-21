"use client";

import type { Message } from "@super-image/utils";
import { useEffect, useRef } from "react";

import { AIMessage } from "@/components/ai-message";
import { UserMessage } from "@/components/user-message";

interface MessageListProps {
  messages: Message[];
  onRetry?: (messageId: string) => void;
  onCancel?: () => void;
}

export function MessageList({ messages, onRetry, onCancel }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Start a conversation
          </h2>
          <p className="text-sm text-foreground-secondary">
            Describe the image you want to generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} message={msg} />
          ) : (
            <AIMessage
              key={msg.id}
              message={msg}
              onRetry={() => onRetry?.(msg.id)}
              onCancel={onCancel}
            />
          ),
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
