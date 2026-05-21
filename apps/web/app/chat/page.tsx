"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { ChatInput } from "@/components/chat-input";
import { ChatLayout } from "@/components/chat-layout";
import { useSessionStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";

export default function ChatPage() {
  const router = useRouter();
  const { createSession } = useSessionStore();
  const { activeProviderId, providers } = useSettingsStore();

  const handleSend = useCallback(
    async (prompt: string, params: { size: string; quality: string; n: number }) => {
      const config = providers[activeProviderId];
      const sessionId = crypto.randomUUID();
      await createSession({
        id: sessionId,
        title: prompt.slice(0, 50),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        providerId: activeProviderId,
        modelId: config?.defaultModel ?? "gpt-image-1",
      });

      // Navigate to the session page — ChatArea will handle the generate call
      // Store the pending prompt in sessionStorage for pickup
      sessionStorage.setItem(
        `pending-prompt-${sessionId}`,
        JSON.stringify({ prompt, params }),
      );
      router.push(`/chat/${sessionId}`);
    },
    [createSession, activeProviderId, providers, router],
  );

  return (
    <ChatLayout>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-medium text-foreground">
            SuperImage
          </h2>
          <p className="text-sm text-foreground-secondary">
            Describe the image you want to generate
          </p>
        </div>
      </div>
      <ChatInput onSend={handleSend} />
    </ChatLayout>
  );
}
