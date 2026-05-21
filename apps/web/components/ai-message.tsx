"use client";

import type { Message } from "@super-image/utils";
import { useState } from "react";

import { ErrorState } from "@/components/error-state";
import { ImageCard } from "@/components/image-card";
import { ImageSkeleton } from "@/components/image-skeleton";
import { Lightbox } from "@/components/lightbox";

interface AIMessageProps {
  message: Message;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function AIMessage({ message, onRetry, onCancel }: AIMessageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isGenerating = message.status === "generating";
  const isError = message.status === "error";
  const isDone = message.status === "done";

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="rounded-bubble bg-background-card border border-border px-4 py-3">
          {/* Generating state */}
          {isGenerating && (
            <ImageSkeleton
              size={message.params?.size ?? "1024x1024"}
              onCancel={onCancel}
            />
          )}

          {/* Error state */}
          {isError && (
            <ErrorState
              message={message.content}
              onRetry={onRetry}
            />
          )}

          {/* Done — show images */}
          {isDone && message.images && message.images.length > 0 && (
            <div
              className={`grid gap-2 ${
                message.images.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {message.images.map((img, idx) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}

          {/* Lightbox */}
          {lightboxIndex !== null && message.images && (
            <Lightbox
              images={message.images}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}

          {/* Revised prompt */}
          {isDone &&
            message.images?.some((img) => img.revisedPrompt) && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-foreground-secondary hover:text-foreground">
                  View revised prompt
                </summary>
                <p className="mt-1 text-xs text-foreground-secondary">
                  {message.images?.find((img) => img.revisedPrompt)?.revisedPrompt}
                </p>
              </details>
            )}
        </div>
        <div className="mt-1 text-[10px] text-foreground-secondary">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
