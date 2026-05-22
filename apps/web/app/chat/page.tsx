"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { ChatInput } from "@/components/chat-input";
import { EmptyState } from "@/components/empty-state";
import { useSessionStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";

export default function ChatPage() {
  const router = useRouter();
  const { createSession } = useSessionStore();
  const { activeProviderId, providers } = useSettingsStore();

  const createAndNavigate = useCallback(
    async (prompt: string, params: { size: string; quality: string; n: number }) => {
      const config = providers[activeProviderId];
      const sessionId = crypto.randomUUID();
      await createSession({
        id: sessionId,
        title: prompt.slice(0, 50),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        providerId: activeProviderId,
        modelId: config?.defaultModel ?? "gpt-image-2",
      });

      sessionStorage.setItem(
        `pending-prompt-${sessionId}`,
        JSON.stringify({ prompt, params }),
      );
      router.push(`/chat/${sessionId}`);
    },
    [createSession, activeProviderId, providers, router],
  );

  const handlePromptClick = useCallback(
    (prompt: string) => {
      const config = providers[activeProviderId];
      createAndNavigate(prompt, {
        size: config?.defaultParams.size ?? "1024x1024",
        quality: config?.defaultParams.quality ?? "auto",
        n: config?.defaultParams.n ?? 1,
      });
    },
    [createAndNavigate, providers, activeProviderId],
  );

  return (
    <>
      <EmptyState onPromptClick={handlePromptClick} />
      <ChatInput onSend={createAndNavigate} />
    </>
  );
}
