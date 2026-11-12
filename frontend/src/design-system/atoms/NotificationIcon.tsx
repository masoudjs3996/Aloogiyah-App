"use client";
import { FC } from "react";
import { IoNotificationsOutline } from "react-icons/io5";

interface Props {
  onClick: () => void;
  unreadCount?: number;
}

const NotificationIcon: FC<Props> = ({ onClick, unreadCount = 0 }) => {
  return (
    <button
      type="button"
      aria-label={unreadCount ? `اعلان‌ها، ${unreadCount} خوانده‌نشده` : "اعلان‌ها"}
      onClick={onClick}
      className="relative rounded-xl border border-slate-200 bg-white p-2 transition hover:bg-gray-50"
    >
      <IoNotificationsOutline size={20} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
          {unreadCount > 99 ? "۹۹+" : unreadCount.toLocaleString("fa-IR")}
        </span>
      )}
    </button>
  );
};

export default NotificationIcon;
