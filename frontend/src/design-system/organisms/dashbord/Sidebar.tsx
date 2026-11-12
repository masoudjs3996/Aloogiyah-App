"use client";

import { motion, AnimatePresence } from "framer-motion";
import { dashboardMenuForRoles } from "@/shared/constants/dashboard-menu";
import SidebarItem from "@/design-system/molecules/dashbord/SidebarItem";
import { FiX } from "react-icons/fi";
import BrandLogo from "@/design-system/atoms/BrandLogo";
import { useUnreadChatCount } from "@/shared/hooks/useUnreadChatCount";

interface SidebarProps {
  role: string;
  roles?: string[];
  collapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export const Sidebar = ({
  role,
  roles,
  collapsed,
  isMobile,
  mobileOpen,
  setMobileOpen,
}: SidebarProps) => {
  const { count } = useUnreadChatCount();
  const effectiveRoles = roles?.length ? roles : [role];
  const filteredMenu = dashboardMenuForRoles(effectiveRoles);

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
              className="dashboard-safe-drawer fixed top-0 right-0 h-dvh w-64 max-w-[90vw] overflow-y-auto bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Close button */}
              <div className="flex justify-between items-center mb-6">
                <BrandLogo compact className="h-12 w-10" />
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
                      unreadCount={menu.path === "/dashboard/chat" ? count : 0}
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
      animate={{ width: collapsed ? 68 : 210 }}
      transition={{ duration: 0.3 }}
      className="text-primary-700 hidden md:flex flex-col p-2 overflow-y-auto shrink-0 bg-white rounded-xl"
    >
      <nav className="flex flex-col gap-4 ">
        <div className="flex items-center gap-2">
          <BrandLogo compact className="h-12 w-10 shrink-0" />

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
            unreadCount={menu.path === "/dashboard/chat" ? count : 0}
          />
        ))}
      </nav>
    </motion.aside>
  );
};
