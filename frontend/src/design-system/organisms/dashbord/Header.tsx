"use client";

import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiBell, FiLogOut, FiMenu } from "react-icons/fi";
import { useSelector } from "react-redux";
import NotificationDropdown from "../Home/NotificationDropdown";
import { useNotifications } from "@/hooks/queries/useNotifications";
import { getPersianRole } from "@/shared/utils/roleUtils";
import useLogout from "@/shared/hooks/useLogout";

interface HeaderProps {
  setCollapsed: (value: boolean) => void;
  collapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function Header({
  setCollapsed,
  collapsed,
  isMobile,
  mobileOpen,
  setMobileOpen,
}: HeaderProps) {
  const user = useSelector((state: any) => state.user.data);
  const logout = useLogout();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;
  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };


  return (
    <header className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-1 flex items-center justify-between">
      <button
        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        onClick={handleMenuClick}
      >
        <FiMenu className="w-6 h-6 text-gray-700" />
      </button>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        <button className="flex items-center gap-2.5 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors">
          <div className="flex min-w-0 flex-col items-end">
            <span className="max-w-24 truncate text-xs font-semibold leading-tight text-gray-800 sm:max-w-40 sm:text-sm">
              {user?.fName}
            </span>
            <span className="hidden text-xs leading-tight text-gray-500 sm:block">
              {getPersianRole(user?.roleName || "نامشخص")}
            </span>
          </div>

          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100 sm:h-10 sm:w-10">
            <Image
              src={getImageUrl(user?.profileImageUrl)}
              alt="امیر حسین"
              width={40}
              height={40}
              className="object-cover"
              unoptimized
            />
          </div>
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label={unreadNotifications ? `اعلان‌ها، ${unreadNotifications} خوانده‌نشده` : "اعلان‌ها"}
            aria-expanded={isNotificationOpen}
            onClick={() => setIsNotificationOpen((open) => !open)}
            className="relative rounded-full p-2 transition-colors hover:bg-gray-50"
          >
            <FiBell className="h-5 w-5 text-gray-600" />
            {unreadNotifications > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadNotifications > 99 ? "۹۹+" : unreadNotifications.toLocaleString("fa-IR")}</span>}
          </button>
          {isNotificationOpen && (
            <NotificationDropdown
              onClose={() => setIsNotificationOpen(false)}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 transition-colors hover:border-red-200 hover:bg-red-100 sm:gap-2 sm:px-3 sm:text-sm"
        >
          <FiLogOut className="h-4 w-4" />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
}
