"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function SidebarItem({ icon, label, collapsed, href, unreadCount = 0 }: { icon: ReactNode; label: string; collapsed: boolean; href: string; unreadCount?: number }) {
 const pathname = usePathname(); const active = href === "/" || href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
 return <Link href={href} replace={href === "/dashboard/chat" && pathname === "/dashboard/chat"} aria-label={unreadCount ? `${label}، ${unreadCount.toLocaleString("fa-IR")} پیام خوانده‌نشده` : label} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-xl p-2.5 transition ${active ? "bg-emerald-50 font-bold text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}><span className="relative shrink-0">{icon}{unreadCount > 0 && <span dir="ltr" className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "۹۹+" : unreadCount.toLocaleString("fa-IR")}</span>}</span>{!collapsed && <span className="whitespace-nowrap text-xs">{label}</span>}</Link>;
}
