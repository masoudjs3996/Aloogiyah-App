"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";


interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  collapsed: boolean;
  href: string;
}

const SidebarItem = ({ icon, label, collapsed, href }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <motion.div
        animate={{ width: collapsed ? 36 : 136 }}
        transition={{ duration: 0.3 }}
        className="flex gap-3  p-2 rounded hover:bg-secondary-900 text-secondary-700 duration-200 cursor-pointer overflow-hidden"
      >
        <div>{icon}</div>

        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm whitespace-nowrap">{label}</p>
          </motion.span>
        )}
      </motion.div>
    </Link>
  );
};

export default SidebarItem;
