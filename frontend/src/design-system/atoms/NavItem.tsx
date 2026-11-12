"use client";
import Link from "next/link";
import { IconType } from "react-icons";
import { FC } from "react";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icon: IconType;
  label: string;
}

const NavItem: FC<NavItemProps> = ({ href, icon: Icon, label }) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
        isActive ? "text-emerald-700" : "text-slate-500"
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="whitespace-nowrap text-[10px] font-bold sm:text-xs">
        {label}
      </span>
    </Link>
  );
};

export default NavItem;
