"use client";

import type { NotificationItem as Notification } from "@/lib/actions/notifications";
import { FiClock, FiTrash2 } from "react-icons/fi";

interface Props {
  notification: Notification;
  onOpen: () => void;
  onDelete: () => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const NotificationItem = ({ notification, onOpen, onDelete }: Props) => {
  const title = notification.type?.trim() || "اعلان جدید";

  return (
    <div className={`group flex items-start gap-2 rounded-xl border p-3 transition ${notification.isRead ? "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50" : "border-emerald-100 bg-emerald-50/80 hover:border-emerald-200"}`}>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-3 text-right"
        aria-label={`${notification.isRead ? "خوانده‌شده" : "خوانده‌نشده"}: ${title}`}
      >
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-slate-200" : "bg-emerald-500 ring-4 ring-emerald-100"}`} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className={`truncate text-sm ${notification.isRead ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>
              {title}
            </span>
            {!notification.isRead && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">جدید</span>}
          </span>
          <span className={`mt-1 line-clamp-2 block text-xs leading-6 ${notification.isRead ? "text-slate-500" : "text-slate-700"}`}>
            {notification.message}
          </span>
          <span className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <FiClock className="h-3 w-3" />
            {formatDate(notification.createdAt)}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="حذف اعلان"
        title="حذف اعلان"
        className="rounded-lg p-2 text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NotificationItem;
