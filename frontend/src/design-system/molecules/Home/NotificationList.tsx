"use client";

import NotificationItem from "@/design-system/atoms/NotificationItem";
import type { NotificationItem as Notification } from "@/lib/actions/notifications";
import { useMemo, useState } from "react";

type Props = {
  notifications: Notification[];
  onOpen: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
};

export default function NotificationList({ notifications, onOpen, onDelete }: Props) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const visibleNotifications = filter === "unread"
    ? notifications.filter((item) => !item.isRead)
    : notifications;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === "all" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          همه <span className="mr-1 opacity-80">{notifications.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === "unread" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          خوانده‌نشده <span className="mr-1 opacity-80">{unreadCount}</span>
        </button>
      </div>

      {visibleNotifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-9 text-center text-sm text-slate-500">
          {filter === "unread" ? "اعلان خوانده‌نشده‌ای ندارید." : "اعلانی برای نمایش وجود ندارد."}
        </div>
      ) : (
        <div className="max-h-[min(58vh,480px)] space-y-2 overflow-y-auto pl-1">
          {visibleNotifications.map((notification) => (
            <NotificationItem
              key={notification.code}
              notification={notification}
              onOpen={() => onOpen(notification)}
              onDelete={() => onDelete(notification)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
