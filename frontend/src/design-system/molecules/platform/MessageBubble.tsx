import type { Message } from "@/shared/types/platform";
import { CheckIcon, ClockIcon } from "@heroicons/react/24/outline";
import { dateLabel } from "@/shared/utils/platform";
export default function MessageBubble({
  item,
  own,
  onRetry,
}: {
  item: Message & { localState?: "pending" | "failed" };
  own: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className={`flex ${own ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${own ? "rounded-tr-sm bg-emerald-700 text-white" : "rounded-tl-sm border border-slate-100 bg-white text-slate-800"}`}
      >
        <p
          dir="auto"
          className="whitespace-pre-wrap break-words text-sm leading-7"
        >
          {item.message}
        </p>
        <div
          className={`mt-2 flex gap-3 text-[10px] ${own ? "text-emerald-100" : "text-slate-400"}`}
        >
          <span>{dateLabel(item.createdAt)}</span>
          {own && item.localState === "pending" && (
            <ClockIcon className="h-3.5 w-3.5" aria-label="در انتظار ارسال" title="در انتظار ارسال" />
          )}
          {own && item.localState === "failed" && (
            <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-amber-200" title="تلاش دوباره برای ارسال">
              <ClockIcon className="h-3.5 w-3.5" />
              <span>تلاش دوباره</span>
            </button>
          )}
          {own && !item.localState && (item.isRead ? (
            <span className="relative inline-flex h-4 w-5 text-sky-200" aria-label="خوانده شده" title="خوانده شده">
              <CheckIcon className="absolute right-0 h-3.5 w-3.5" />
              <CheckIcon className="absolute right-1.5 h-3.5 w-3.5" />
            </span>
          ) : (
            <CheckIcon className="h-3.5 w-3.5" aria-label="ارسال شده" title="ارسال شده" />
          ))}
        </div>
      </div>
    </div>
  );
}
