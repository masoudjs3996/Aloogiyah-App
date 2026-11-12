"use client";
import type { Message } from "@/shared/types/platform";
import { chatFileSize } from "@/shared/utils/chat-file-size";
export default function ChatMediaPlaceholder({
  item,
  busy,
  failed,
  video,
  ready = false,
  progress = null,
  downloaded = 0,
  total = item.attachmentSize || 0,
  onDownload,
}: {
  item: Message;
  busy: boolean;
  failed: boolean;
  video?: boolean;
  ready?: boolean;
  progress?: number | null;
  downloaded?: number;
  total?: number;
  onDownload: () => void;
}) {
  const preview = item.attachmentPreview?.startsWith("data:image/jpeg;base64,")
    ? item.attachmentPreview
    : undefined;
  const percent =
    progress === null ? null : Math.max(0, Math.min(100, progress));
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onDownload}
      aria-label={
        ready
          ? "پخش فیلم"
          : failed
          ? "تلاش دوباره برای دریافت"
          : video
            ? "دریافت و پخش فیلم"
            : "دریافت عکس"
      }
      aria-busy={busy}
      className={`relative flex h-40 ${video ? "w-56" : "w-64"} max-w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-800 p-3 text-white`}
    >
      {preview && (
        // This is a tiny inline preview, never the original media URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-md"
        />
      )}
      <span className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <span
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/50 text-2xl"
        aria-hidden="true"
      >
        {ready ? "▶" : "↓"}
        {busy && (
          <svg
            viewBox="0 0 56 56"
            className={`absolute inset-0 h-14 w-14 -rotate-90 ${percent === null ? "animate-spin" : ""}`}
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="3"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="#6ee7b7"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={percent === null ? "25 75" : "100"}
              strokeDashoffset={percent === null ? 0 : 100 - percent}
            />
          </svg>
        )}
      </span>
      <span className="relative text-xs">{chatFileSize(total)}</span>
      {busy && (
        <span
          className="relative text-[10px] leading-5"
          role="progressbar"
          aria-label="پیشرفت دانلود"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? undefined}
        >
          {chatFileSize(Math.min(total, downloaded))} دریافت‌شده ·{" "}
          {chatFileSize(Math.max(0, total - downloaded))} باقی‌مانده
        </span>
      )}
    </button>
  );
}
