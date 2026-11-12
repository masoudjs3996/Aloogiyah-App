import { ArrowPathIcon, PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ChatUpload } from "@/shared/hooks/useChatUploadQueue";
import { chatFileSize } from "@/shared/utils/chat-file-size";

export default function ChatUploadBubble({ item, onCancel, onRetry, grouped = false }: {
  item: ChatUpload;
  grouped?: boolean;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const failed = item.state === "failed";
  const uploading = item.state === "uploading";
  const progress = item.progress;
  const ringProgress = progress === null ? null : Math.min(99, progress);
  const status = failed ? "ارسال نشد" : !uploading ? "در صف ارسال"
    : progress === 100 ? "در حال ثبت فایل…" : progress === null ? "در حال آماده‌سازی…"
    : `در حال ارسال · ${progress.toLocaleString("fa-IR")}٪`;
  return (
    <div className="flex justify-start" dir="rtl">
      <div className={`flex ${grouped ? "w-full" : "w-80"} max-w-full items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3`}>
        <button type="button" onClick={failed ? onRetry : onCancel}
          aria-label={failed ? "تلاش دوباره برای ارسال فایل" : "لغو ارسال فایل"}
          title={failed ? "تلاش دوباره" : "لغو ارسال"}
          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-emerald-800 focus-visible:outline-emerald-600">
          {failed ? <ArrowPathIcon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5" />}
          {uploading && <svg aria-hidden="true" viewBox="0 0 48 48"
            className={`pointer-events-none absolute inset-0 h-12 w-12 -rotate-90 ${progress === null ? "motion-safe:animate-spin" : ""}`}>
            <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" opacity=".18" />
            <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
              pathLength="100" strokeDasharray={progress === null ? "24 76" : "100"}
              strokeDashoffset={ringProgress === null ? 0 : 100 - ringProgress} className="motion-safe:transition-all" />
          </svg>}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <PaperClipIcon className="h-4 w-4 shrink-0 text-emerald-800" />
            <bdi className="truncate text-sm font-bold text-slate-900" title={item.file.name}>{item.file.name}</bdi>
          </div>
          <p className="mt-1 text-xs text-slate-600">{chatFileSize(item.file.size)}</p>
          {!grouped && item.caption && <p dir="auto" className="mt-1 whitespace-pre-wrap break-words text-sm">{item.caption}</p>}
          <p className={`mt-1 text-xs ${failed ? "text-rose-800" : "text-emerald-800"}`}
            role={uploading ? "progressbar" : "status"} aria-label={uploading ? "پیشرفت ارسال فایل" : undefined}
            aria-valuenow={uploading ? ringProgress ?? undefined : undefined} aria-valuetext={uploading ? status : undefined}>
            {status}
          </p>
          {failed && <>
            <p className="mt-1 break-words text-xs leading-6 text-rose-800">{item.error}</p>
            <button type="button" onClick={onCancel} className="mt-1 text-xs text-slate-600 underline">حذف از صف</button>
          </>}
        </div>
      </div>
    </div>
  );
}
