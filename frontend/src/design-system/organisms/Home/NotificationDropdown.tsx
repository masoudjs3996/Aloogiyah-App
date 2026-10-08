"use client";

import NotificationList from "@/design-system/molecules/Home/NotificationList";
import type { NotificationItem as Notification } from "@/lib/actions/notifications";
import useOutsideClick from "@/shared/hooks/useClickOutside";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { FiBell, FiCheck, FiTrash2, FiX } from "react-icons/fi";

interface Props {
  onClose: () => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const NotificationDropdown = ({ onClose }: Props) => {
  const ref = useOutsideClick<HTMLDivElement>(onClose);
  const { data: notifications, isLoading, error, markAsRead, deleteNotification } = useNotifications();
  const [selected, setSelected] = useState<Notification | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selected) setSelected(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, selected]);

  const openNotification = async (notification: Notification) => {
    setSelected(notification);
    if (!notification.isRead) {
      try {
        await markAsRead(notification.code);
        setSelected((current) => current?.code === notification.code ? { ...current, isRead: true } : current);
      } catch {
        toast.error("خوانده‌شدن اعلان ثبت نشد. دوباره تلاش کنید.");
      }
    }
  };

  const removeNotification = async (notification: Notification) => {
    try {
      await deleteNotification(notification.code);
      if (selected?.code === notification.code) setSelected(null);
      toast.success("اعلان حذف شد.");
    } catch {
      toast.error("حذف اعلان انجام نشد. دوباره تلاش کنید.");
    }
  };

  return (
    <div
      ref={ref}
      dir="rtl"
      className="fixed inset-x-2 top-[4.5rem] z-[90] flex max-h-[calc(100dvh-5rem)] w-auto flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/15 md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-3 md:max-h-[min(75vh,620px)] md:w-[min(24rem,calc(100vw-2rem))]"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FiBell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">اعلان‌ها</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {unreadCount ? `${unreadCount} اعلان خوانده‌نشده` : "همه اعلان‌ها خوانده شده‌اند"}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="بستن اعلان‌ها" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
        {isLoading ? (
          <div role="status" className="space-y-3 py-2" aria-label="در حال دریافت اعلان‌ها">
            {[0, 1, 2].map((item) => <div key={item} className="animate-pulse rounded-xl bg-slate-100 p-4"><div className="mb-3 h-3 w-1/3 rounded bg-slate-200" /><div className="h-3 w-full rounded bg-slate-200" /></div>)}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 p-5 text-center text-sm leading-6 text-red-700">
            دریافت اعلان‌ها با خطا روبه‌رو شد. صفحه را دوباره بارگذاری کنید.
          </div>
        ) : (
          <NotificationList
            notifications={notifications}
            onOpen={openNotification}
            onDelete={removeNotification}
          />
        )}
      </div>

      {selected && portalRoot && createPortal((
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-3 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="notification-title" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><FiBell className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <h3 id="notification-title" className="truncate font-bold text-slate-900">{selected.type?.trim() || "اعلان جدید"}</h3>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="بستن جزئیات اعلان"
                title="بستن"
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <FiX className="h-5 w-5" />
                <span>بستن</span>
              </button>
            </div>
            <div className="max-h-[55dvh] overflow-y-auto px-5 py-6 sm:px-6">
              <p className="whitespace-pre-wrap break-words text-sm leading-8 text-slate-700">{selected.message}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><FiCheck className="h-4 w-4" /> خوانده‌شده</span>
              <button type="button" onClick={() => void removeNotification(selected)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                <FiTrash2 className="h-4 w-4" /> حذف اعلان
              </button>
            </div>
          </section>
        </div>
      ), portalRoot)}
    </div>
  );
};

export default NotificationDropdown;
