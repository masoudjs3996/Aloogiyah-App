"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ChatMediaPlaceholder from "./ChatMediaPlaceholder";
import { useChatMedia } from "@/shared/hooks/useChatMedia";
import type { Message } from "@/shared/types/platform";

function VideoWindow({ uri, name, onClose, onRetry }: {
  uri: string;
  name?: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, []);
  return createPortal(
    <dialog ref={dialog} aria-label="پخش فیلم" onCancel={event => { event.preventDefault(); onClose(); }}
      className="m-auto w-[min(960px,95vw)] rounded-xl bg-slate-950 p-3 text-white backdrop:bg-black/80">
      <div className="mb-2 flex items-center justify-between gap-3">
        <button autoFocus type="button" onClick={onClose} className="rounded px-4 py-2">بستن ×</button>
        <a href={uri} download={name || "video.mp4"} className="rounded px-4 py-2">ذخیره فیلم</a>
      </div>
      <video src={uri} controls autoPlay playsInline aria-label="فیلم پیام" className="max-h-[80dvh] w-full"
        onLoadedData={() => setFailed(false)} onError={() => setFailed(true)} />
      {failed && (
        <div className="mt-2 px-3 py-2 text-sm text-amber-200" role="alert">
          <p>پخش فیلم ممکن نشد. می‌توانید فایل را ذخیره کنید یا دوباره دریافت کنید.</p>
          <button type="button" className="mt-2 underline" onClick={onRetry}>دریافت دوباره فیلم</button>
        </div>
      )}
    </dialog>,
    document.body,
  );
}

export default function ChatVideo({ item }: { item: Message }) {
  const { uri, busy, failed, progress, downloaded, total, checking, load, invalidate } = useChatMedia(item);
  const [expanded, setExpanded] = useState(false);
  if (checking)
    return <div className="h-40 w-56 max-w-full rounded-xl bg-slate-100" aria-busy="true" />;
  return (
    <div className="w-56 max-w-full">
      <ChatMediaPlaceholder item={item} busy={busy} failed={failed} video ready={!!uri}
        progress={progress} downloaded={downloaded} total={total}
        onDownload={() => {
          if (uri) setExpanded(true);
          else void load().then(cached => { if (cached) setExpanded(true); });
        }} />
      {uri && expanded && <VideoWindow uri={uri} name={item.attachmentName}
        onClose={() => setExpanded(false)}
        onRetry={() => { setExpanded(false); invalidate(); }} />}
    </div>
  );
}
