"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function SidebarItem({ icon, label, collapsed, href }: { icon: ReactNode; label: string; collapsed: boolean; href: string }) {
 const pathname = usePathname(); const active = href === "/" || href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
 return <Link href={href} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-xl p-2.5 transition ${active ? "bg-emerald-50 font-bold text-emerald-800" : "text-slate-600 hover:bg-slate-50"}`}><span className="shrink-0">{icon}</span>{!collapsed && <span className="whitespace-nowrap text-xs">{label}</span>}</Link>;
}
