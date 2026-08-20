"use client";

import Image from "next/image";
import { FiChevronDown, FiBell, FiMenu } from "react-icons/fi";

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
  const handleMenuClick = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <header className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-1 flex items-center justify-between">
      {/* Menu Button */}
      <button
        className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        onClick={handleMenuClick}
      >
        <FiMenu className="w-6 h-6 text-gray-700" />
      </button>

      <div className="flex items-center gap-3">
        {/* Profile Section */}
        <button className="flex items-center gap-2.5 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors">
          <FiChevronDown className="w-4 h-4 text-gray-500" />

          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800 leading-tight">
              امیر حسین
            </span>
            <span className="text-xs text-gray-500 leading-tight">
              مدیر سیستم
            </span>
          </div>

          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100">
            <Image
              src="https://i.pravatar.cc/150?img=12"
              alt="امیر حسین"
              width={40}
              height={40}
              className="object-cover"
              unoptimized
            />
          </div>
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 hover:bg-gray-50 rounded-full transition-colors">
          <FiBell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] bg-emerald-500 text-white text-[10px] font-bold rounded-full">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
