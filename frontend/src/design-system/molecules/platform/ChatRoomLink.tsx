"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { errorMessage, platformApi } from "@/lib/actions/platform";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";

export default function ChatRoomLink({
  receiverCode,
  qualityAssessmentCode,
  contextName,
  contextType,
  selfContactHint,
  className,
  children,
}: {
  receiverCode: string;
  qualityAssessmentCode?: string;
  contextName?: string;
  contextType?: string;
  selfContactHint?: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const profile = usePlatformProfile();
  const isSelf = receiverCode === profile.data?.user?.code;

  async function openChat() {
    if (!receiverCode || busy) return;
    setBusy(true);
    try {
      const room = qualityAssessmentCode
        ? await platformApi.assessmentConversation(qualityAssessmentCode)
        : await platformApi.getOrCreateConversation(receiverCode);
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

  if (isSelf && !selfContactHint) return null;
  return (
    <>
      <button
        type="button"
        onClick={openChat}
        disabled={busy || isSelf}
        aria-busy={busy}
        className={className}
      >
        {busy ? "در حال آماده‌سازی گفت‌وگو…" : children}
      </button>
      {isSelf && <p className="order-last w-full text-xs leading-6 text-slate-600">{selfContactHint}</p>}
    </>
  );
}
