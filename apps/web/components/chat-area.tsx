"use client";

import type { Session } from "@super-image/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { ChatInput } from "@/components/chat-input";
import { EditSourcePreview } from "@/components/edit-source-preview";
import { MessageList } from "@/components/message-list";
import { useChatStore } from "@/stores/chat-store";
import { useSessionStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";

interface ChatAreaProps {
  sessionId: string;
}

export function ChatArea({ sessionId }: ChatAreaProps) {
  const { messages, generating, loadMessages, sendGenerate, sendEdit, cancelGeneration } =
    useChatStore();
  const { getSession, createSession, updateSession } = useSessionStore();
  const router = useRouter();

  const session = getSession(sessionId);
  const isEditSession = session?.type === "edit";
  const sourceImageId = session?.sourceImageId;

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
      if (isEditSession && sourceImageId) {
        await sendEdit(sessionId, prompt, sourceImageId, params);
      } else {
        await sendGenerate(sessionId, prompt, params);
      }
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
    [sessionId, isEditSession, sourceImageId, sendGenerate, sendEdit, updateSession],
  );

  const handleRetry = useCallback(
    async (messageId: string) => {
      // Find the user message before this AI message
      const msgs = useChatStore.getState().messages;
      const aiIdx = msgs.findIndex((m) => m.id === messageId);
      if (aiIdx <= 0) return;
      const userMsg = msgs[aiIdx - 1];
      if (userMsg?.role !== "user") return;

      const retryParams = {
        size: userMsg.params?.size ?? "1024x1024",
        quality: userMsg.params?.quality ?? "auto",
        n: userMsg.params?.n ?? 1,
      };

      if (isEditSession && sourceImageId) {
        await sendEdit(sessionId, userMsg.content, sourceImageId, retryParams);
      } else {
        await sendGenerate(sessionId, userMsg.content, retryParams);
      }
    },
    [sessionId, isEditSession, sourceImageId, sendGenerate, sendEdit],
  );

  const handleEditImage = useCallback(
    async (imageId: string) => {
      const settings = useSettingsStore.getState();
      const newSessionId = crypto.randomUUID();
      const newSession: Session = {
        id: newSessionId,
        title: "Edit Image",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        providerId: settings.activeProviderId,
        modelId: settings.providers[settings.activeProviderId]?.defaultModel ?? "gpt-image-1",
        type: "edit",
        sourceImageId: imageId,
      };
      await createSession(newSession);
      router.push(`/chat/${newSessionId}`);
    },
    [createSession, router],
  );

  return (
    <>
      {isEditSession && sourceImageId && (
        <EditSourcePreview imageId={sourceImageId} />
      )}
      <MessageList
        messages={messages}
        onRetry={handleRetry}
        onCancel={generating ? cancelGeneration : undefined}
        onEdit={handleEditImage}
      />
      <ChatInput onSend={handleSend} disabled={generating} />
    </>
  );
}
