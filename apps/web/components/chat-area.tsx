"use client";

import { useCallback, useEffect } from "react";

import { ChatInput } from "@/components/chat-input";
import { MessageList } from "@/components/message-list";
import { useChatStore } from "@/stores/chat-store";
import { useSessionStore } from "@/stores/session-store";

interface ChatAreaProps {
  sessionId: string;
}

export function ChatArea({ sessionId }: ChatAreaProps) {
  const { messages, generating, loadMessages, sendGenerate, cancelGeneration } =
    useChatStore();
  const { updateSession } = useSessionStore();

  useEffect(() => {
    loadMessages(sessionId).then(() => {
      // Check for pending prompt from new session creation
      const pendingKey = `pending-prompt-${sessionId}`;
      const pending = sessionStorage.getItem(pendingKey);
      if (pending) {
        sessionStorage.removeItem(pendingKey);
        const { prompt, params } = JSON.parse(pending) as {
          prompt: string;
          params: { size: string; quality: string; n: number };
        };
        sendGenerate(sessionId, prompt, params);
      }
    });
  }, [sessionId, loadMessages, sendGenerate]);

  const handleSend = useCallback(
    async (prompt: string, params: { size: string; quality: string; n: number }) => {
      await sendGenerate(sessionId, prompt, params);
      // Update session title if first message
      const msgs = useChatStore.getState().messages;
      if (msgs.filter((m) => m.role === "user").length === 1) {
        await updateSession(sessionId, {
          title: prompt.slice(0, 50),
          updatedAt: Date.now(),
        });
      } else {
        await updateSession(sessionId, { updatedAt: Date.now() });
      }
    },
    [sessionId, sendGenerate, updateSession],
  );

  const handleRetry = useCallback(
    async (messageId: string) => {
      // Find the user message before this AI message
      const msgs = useChatStore.getState().messages;
      const aiIdx = msgs.findIndex((m) => m.id === messageId);
      if (aiIdx <= 0) return;
      const userMsg = msgs[aiIdx - 1];
      if (userMsg?.role !== "user") return;

      await sendGenerate(sessionId, userMsg.content, {
        size: userMsg.params?.size ?? "1024x1024",
        quality: userMsg.params?.quality ?? "auto",
        n: userMsg.params?.n ?? 1,
      });
    },
    [sessionId, sendGenerate],
  );

  return (
    <>
      <MessageList
        messages={messages}
        onRetry={handleRetry}
        onCancel={generating ? cancelGeneration : undefined}
      />
      <ChatInput onSend={handleSend} disabled={generating} />
    </>
  );
}
