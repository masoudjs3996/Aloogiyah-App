"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { errorMessage, platformApi } from "@/lib/actions/platform";

export default function ChatRoomLink({
  receiverCode,
  contextName,
  contextType,
  className,
  children,
}: {
  receiverCode: string;
  contextName?: string;
  contextType?: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function openChat() {
    if (!receiverCode || busy) return;
    setBusy(true);
    try {
      const room = await platformApi.getOrCreateConversation(receiverCode);
      const params = new URLSearchParams({ room: room.code });
      if (contextName) params.set("contextName", contextName);
      if (contextType) params.set("contextType", contextType);
      router.push(`/dashboard/chat?${params.toString()}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={openChat} disabled={busy} aria-busy={busy} className={className}>
      {busy ? "در حال آماده‌سازی گفت‌وگو…" : children}
    </button>
  );
}
