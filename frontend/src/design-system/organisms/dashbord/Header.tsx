"use client";

import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiChevronDown, FiBell, FiMenu } from "react-icons/fi";
import { useSelector } from "react-redux";
import NotificationDropdown from "../Home/NotificationDropdown";
import { useNotifications } from "@/hooks/queries/useNotifications";

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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { data: NotifData } = useNotifications();
  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  useEffect(() => {
    console.log(user);
  }, [user]);

  return (
    <header className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-1 flex items-center justify-between">
      <button
        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        onClick={handleMenuClick}
      >
        <FiMenu className="w-6 h-6 text-gray-700" />
      </button>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2.5 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800 leading-tight">
              {user?.fName}
            </span>
            <span className="text-xs text-gray-500 leading-tight">
              {user?.roleName}
            </span>
          </div>

          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100">
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

        <button className="relative p-2 hover:bg-gray-50 rounded-full transition-colors">
          <FiBell
            className="w-5 h-5 text-gray-600"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          />
          {isNotificationOpen && (
            <NotificationDropdown
              onClose={() => setIsNotificationOpen(false)}
              data={NotifData}
            />
          )}
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full">
            {NotifData?.data?.length}
          </span>
        </button>
      </div>
    </header>
  );
}
