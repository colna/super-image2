"use client";

import { ChatLayout } from "@/components/chat-layout";

export default function ChatRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatLayout>{children}</ChatLayout>;
}
