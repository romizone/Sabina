import { SiteHeader } from "@/components/SiteHeader";
import { ChatApp } from "@/components/ChatApp";

export default function ChatPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f6f8]">
      <SiteHeader compact />
      <ChatApp />
    </div>
  );
}
