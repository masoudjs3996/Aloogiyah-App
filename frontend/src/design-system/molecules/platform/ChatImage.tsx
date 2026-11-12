"use client";
import { useEffect, useRef, useState } from "react";
import ChatMediaPlaceholder from "./ChatMediaPlaceholder";
import { useChatMedia } from "@/shared/hooks/useChatMedia";
import type { Message } from "@/shared/types/platform";

export default function ChatImage({ item }: { item: Message }) {
  const {
    uri: url,
    busy,
    failed,
    progress,
    downloaded,
    total,
    checking,
    load,
    invalidate,
  } = useChatMedia(item);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (url && open && !dialog.current?.open) dialog.current?.showModal();
  }, [url, open]);
  if (checking)
    return (
      <div
        className="h-40 w-64 max-w-full rounded-xl bg-slate-100"
        aria-busy="true"
      />
    );
  if (!url)
    return (
      <ChatMediaPlaceholder
        item={item}
        busy={busy}
        failed={failed}
        progress={progress}
        downloaded={downloaded}
        total={total}
        onDownload={() => void load().then(cached => { if (cached) setOpen(true); })}
      />
    );
  return (
    <>
      <button
        type="button"
        className="block"
        aria-label="نمایش بزرگ عکس"
        onClick={() => setOpen(true)}
      >
        {/* Authenticated private blob URLs cannot use the public image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={item.attachmentName || "عکس پیام"}
          className="h-auto w-64 max-w-full rounded-xl"
          onError={() => { setOpen(false); invalidate(); }}
        />
      </button>
      <dialog
        ref={dialog}
        aria-label="نمایش عکس"
        onClose={() => setOpen(false)}
        className="m-auto max-h-[95dvh] max-w-[95vw] rounded-xl bg-slate-950 p-3 text-white backdrop:bg-black/80"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          type="button"
          autoFocus
          className="mb-3 rounded-lg px-4 py-2"
          onClick={() => dialog.current?.close()}
        >
          بستن
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={item.attachmentName || "عکس پیام"}
          className="max-h-[78dvh] max-w-full object-contain"
        />
        <a
          className="mt-3 block p-2 text-2xl"
          href={url}
          download={item.attachmentName}
          aria-label="ذخیره عکس"
          title="ذخیره عکس"
        >
          ↓
        </a>
      </dialog>
    </>
  );
}
