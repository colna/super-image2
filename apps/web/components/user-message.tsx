import type { Message } from "@super-image/utils";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "80%" }}>
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
