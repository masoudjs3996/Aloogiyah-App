"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useUnreadChatCount } from "@/shared/hooks/useUnreadChatCount";
export default function ChatUnreadButton() {
  const pathname = usePathname();
  const { count, enabled } = useUnreadChatCount();
  if (!enabled) return null;
  return (
    <Link
      href="/dashboard/chat"
      replace={pathname === "/dashboard/chat"}
      aria-label={
        count
          ? `گفت‌وگوها، ${count.toLocaleString("fa-IR")} پیام خوانده‌نشده`
          : "گفت‌وگوها"
      }
      title="گفت‌وگوها"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-emerald-50"
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5" />
      {count > 0 && (
        <span
          dir="ltr"
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          {count > 99 ? "۹۹+" : count.toLocaleString("fa-IR")}
        </span>
      )}
    </Link>
  );
}
