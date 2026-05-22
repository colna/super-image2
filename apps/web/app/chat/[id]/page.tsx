"use client";

import { useParams } from "next/navigation";

import { ChatArea } from "@/components/chat-area";

export default function ChatSessionPage() {
  const params = useParams<{ id: string }>();

  return <ChatArea sessionId={params.id} />;
}
