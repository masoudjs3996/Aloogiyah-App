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
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center transition-colors  ${
        isActive ? "text-accent_foreground" : "text-muted_foreground "
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs mt-1 text-nowrap hidden sm:block">{label}</span>
    </Link>
  );
};

export default NavItem;
