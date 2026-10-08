"use client";
import { FC, useEffect, useRef, useState } from "react";
import Link from "next/link";
import IconButton from "../../atoms/IconButton";
import { usePathname } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { TiShoppingCart } from "react-icons/ti";
import { FaLeaf } from "react-icons/fa";
import { BiMenu, BiX } from "react-icons/bi";
import { useSelector } from "react-redux";
import useLogout from "@/shared/hooks/useLogout";
import SearchInput from "@/design-system/atoms/SearchInput";
import NotificationIcon from "@/design-system/atoms/NotificationIcon";
import NotificationDropdown from "@/design-system/organisms/Home/NotificationDropdown";
import { useNotifications } from "@/hooks/queries/useNotifications";

const HeaderTop: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const user = useSelector((state: any) => state.user.data);
  const logout = useLogout();
  const pathname = usePathname();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;
  const navLinks = [
    { id: 1, href: "/", label: "خانه" },
    { id: 2, href: "/categories", label: "دسته بندی" },
    { id: 3, href: "/product", label: "محصولات" },
    { id: 4, href: "/farm", label: "مزارع" },
    { id: 6, href: "/dashboard", label: "داشبورد" },
    { id: 5, href: "/articles", label: "مجله" },
    { id: 7, href: "/dashboard/services", label: "خدمات گیاه" },
  ];
  const handleLogout = async () => {
    setIsAccountMenuOpen(false);
    setIsMenuOpen(false);
    await logout();
  };
  const displayName =
    [user?.fName, user?.lName].filter(Boolean).join(" ") ||
    user?.userName ||
    "حساب من";

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen]);
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="container-custom flex h-16 items-center justify-between gap-2 md:h-20">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-md p-2 text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <BiX className="h-7 w-7" />
          ) : (
            <BiMenu className="h-7 w-7" />
          )}
        </button>
        {/* Logo */}
        <div className="flex gap-x-1 items-center ">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green">
              <FaLeaf className="h-6 w-6 text-green_foreground " />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">
              الو گیاه
            </span>
          </Link>
          <div className="relative">
            <NotificationIcon
              unreadCount={unreadNotifications}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            />

            {isNotificationOpen && (
              <NotificationDropdown
                onClose={() => setIsNotificationOpen(false)}
              />
            )}
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium duration-200 transition-colors ${
                pathname === link.href
                  ? "bg-secondary-700 text-white"
                  : "text-muted_foreground hover:bg-secondary-700 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden w-48 lg:block xl:w-56">
          <SearchInput />
        </div>
        <Link
          href="/checkout/card"
          aria-label="سبد خرید"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-2.5 py-2 text-sm font-semibold text-secondary-700 transition-colors hover:bg-primary/90 sm:px-4"
        >
          <IconButton icon={<TiShoppingCart className="w-6 h-7 " />} />
        </Link>
        <div ref={accountMenuRef} className="relative shrink-0">
          {user ? (
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              className="inline-flex max-w-36 items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-emerald-900 transition hover:border-emerald-200 hover:bg-emerald-100 sm:max-w-52 sm:gap-2 sm:px-3"
            >
              <UserCircleIcon className="h-5 w-5 shrink-0 text-emerald-700" />
              <span className="hidden max-w-14 truncate text-[10px] font-bold min-[380px]:inline sm:max-w-36 sm:text-sm">
                <span className="sm:hidden">{displayName.split(" ")[0]}</span>
                <span className="hidden sm:inline">{displayName}</span>
              </span>
              <ChevronDownIcon className={`hidden h-4 w-4 transition-transform sm:block ${isAccountMenuOpen ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <Link
              href="/Login"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-2.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <UserIcon className="h-4 w-4" />
              <span>ورود</span>
            </Link>
          )}
          {user && isAccountMenuOpen && (
            <div
              role="menu"
              dir="rtl"
              className="absolute left-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10"
            >
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                {user?.phoneNumber && (
                  <p className="mt-1 text-xs text-slate-500" dir="ltr">
                    {user.phoneNumber}
                  </p>
                )}
              </div>
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setIsAccountMenuOpen(false)}
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Squares2X2Icon className="h-5 w-5 text-emerald-700" />
                داشبورد من
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                خروج از حساب
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="container-custom px-4 pb-3 lg:hidden">
        <SearchInput />
      </div>
      {/* mobile nav */}
      {isMenuOpen && (
        <div className="border-t border-border bg-card lg:hidden">
          <nav className="container-custom flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-md px-4 py-3 text-base font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-accent text-accent_foreground"
                    : "text-muted_foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default HeaderTop;
