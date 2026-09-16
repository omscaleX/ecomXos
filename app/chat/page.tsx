import type { Metadata } from "next";
import { ChatView } from "@/components/chat/ChatView";

export const metadata: Metadata = { title: "Chat & Huddle · Agency OS" };

export default function ChatPage() {
  return <ChatView />;
}
