"use client";

import { FileImageOutlined } from "@ant-design/icons";
import type { Message } from "@super-image/utils";
import { useEffect, useState } from "react";

import { ImagePreview } from "@/components/image-preview";
import { getAttachment } from "@/lib/db";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  const [thumbUrls, setThumbUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!message.attachments?.length) return;

    let cancelled = false;
    const urls: string[] = [];

    (async () => {
      for (const att of message.attachments!) {
        if (att.type === "image") {
          const stored = await getAttachment(att.id);
          if (stored && !cancelled) {
            urls.push(URL.createObjectURL(stored.blob));
          }
        }
      }
      if (!cancelled) setThumbUrls(urls);
    })();

    return () => {
      cancelled = true;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [message.attachments]);

  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "80%" }}>
        {/* Attachment thumbnails */}
        {thumbUrls.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {thumbUrls.map((url, i) => (
              <ImagePreview key={url} src={url} alt={message.attachments?.[i]?.name}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={message.attachments?.[i]?.name ?? "attachment"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </ImagePreview>
            ))}
          </div>
        )}
        {/* Non-image attachment badges */}
        {message.attachments?.some((a) => a.type === "file") && (
          <div style={{ display: "flex", gap: 4, marginBottom: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {message.attachments
              .filter((a) => a.type === "file")
              .map((a) => (
                <span
                  key={a.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    color: "#ccc",
                  }}
                >
                  <FileImageOutlined /> {a.name}
                </span>
              ))}
          </div>
        )}
        <div
          style={{
            borderRadius: 12,
            background: "#1a1a1a",
            padding: "10px 16px",
            fontSize: 14,
            color: "#fff",
          }}
        >
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{message.content}</p>
        </div>
        <div style={{ marginTop: 4, textAlign: "right", fontSize: 10, color: "#bbb" }}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
