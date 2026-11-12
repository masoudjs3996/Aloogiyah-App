"use client";
import ChatImage from "./ChatImage";
import ChatVideo from "./ChatVideo";
import { useState } from "react";
import toast from "react-hot-toast";
import { errorMessage } from "@/lib/actions/platform";
import type { Message } from "@/shared/types/platform";
import { downloadChatAttachment } from "@/shared/utils/download-chat-attachment";
export default function ChatFileDownload({ item }: { item: Message }) {
  const [busy, setBusy] = useState(false);
  if (item.attachmentType?.startsWith("video/"))
    return <ChatVideo key={item.code} item={item} />;
  if (item.attachmentType?.startsWith("image/"))
    return <ChatImage item={item} />;
  return (
    <button
      type="button"
      disabled={busy}
      className="block max-w-full break-words rounded-lg border border-current/20 p-3 text-right text-sm"
      onClick={async () => {
        setBusy(true);
        try {
          await downloadChatAttachment(item);
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      📎 {item.attachmentName}
      <span className="mt-1 block text-xs opacity-75">
        {busy ? "در حال دریافت…" : "دریافت فایل"} ·{" "}
        {Math.ceil((item.attachmentSize || 0) / 1024).toLocaleString("fa-IR")}{" "}
        کیلوبایت
      </span>
    </button>
  );
}
