"use client";

import { motion, AnimatePresence } from "framer-motion";
import { dashboardMenu } from "@/shared/constants/dashboard-menu";
import SidebarItem from "@/design-system/molecules/dashbord/SidebarItem";
import { FiX } from "react-icons/fi";
import { FaLeaf } from "react-icons/fa";

interface SidebarProps {
  role: string;
  collapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export const Sidebar = ({
  role,
  collapsed,
  isMobile,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) => {
  const filteredMenu = dashboardMenu.filter((menu) =>
    menu.roles.includes(role),
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer from right (RTL) */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col p-4"
            >
              {/* Close button */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-primary-700">منو</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <nav className="flex flex-col gap-3 ">
                {filteredMenu.map((menu) => (
                  <div
                    key={`${menu.path}-${menu.label}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <SidebarItem
                      icon={<menu.icon size={20} />}
                      label={menu.label}
                      collapsed={false}
                      href={menu.path}
                    />
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 160 }}
      transition={{ duration: 0.3 }}
      className="text-primary-700 flex flex-col p-2 overflow-hidden shrink-0 bg-white rounded-xl"
    >
      <nav className="flex flex-col gap-4 ">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green">
            <FaLeaf className="h-6 w-6 shrink-0 text-green_foreground" />
          </div>

          {!collapsed && (
            <span className="whitespace-nowrap font-heading text-xl font-bold text-foreground">
              الو گیاه
            </span>
          )}
        </div>
        {filteredMenu.map((menu) => (
          <SidebarItem
            icon={<menu.icon size={20} />}
            label={menu.label}
            key={`${menu.path}-${menu.label}`}
            collapsed={collapsed}
            href={menu.path}
          />
        ))}
      </nav>
    </motion.aside>
  );
};
