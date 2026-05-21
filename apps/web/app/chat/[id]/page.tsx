"use client";

import { useParams } from "next/navigation";

import { ChatArea } from "@/components/chat-area";
import { ChatLayout } from "@/components/chat-layout";

export default function ChatSessionPage() {
  const params = useParams<{ id: string }>();

  return (
    <ChatLayout>
      <ChatArea sessionId={params.id} />
    </ChatLayout>
  );
}
