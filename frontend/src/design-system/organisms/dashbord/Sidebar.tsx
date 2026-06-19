"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMenu } from "react-icons/fi";
import { dashboardMenu } from "@/shared/constants/dashboard-menu";
import SidebarItem from "@/design-system/molecules/dashbord/SidebarItem";

interface SidebarProps {
  role: string;
}

export const Sidebar = ({ role }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const filteredMenu = dashboardMenu.filter((menu) =>
    menu.roles.includes(role),
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 160 }}
      transition={{ duration: 0.3 }}
      className="bg-secondary-200 text-primary-700 flex flex-col p-2 overflow-hidden "
    >
      <motion.div
        animate={{ width: collapsed ? 36 : 136 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`mb-6 p-2 rounded hover:bg-slate-700 transition `}
        >
          <FiMenu size={20} />
        </button>
      </motion.div>

      <nav className={`flex flex-col gap-4`}>
        {filteredMenu.map((menu) => {
          return (
            <SidebarItem
              icon={<menu.icon size={20} />}
              label={menu.label}
              key={`${menu.path}-${menu.label}`}
              collapsed={collapsed}
              href={menu.path}
            />
          );
        })}
      </nav>
    </motion.aside>
  );
};
