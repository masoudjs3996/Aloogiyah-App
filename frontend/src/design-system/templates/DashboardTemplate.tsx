"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "../organisms/dashbord/Sidebar";
import { useUser } from "@/hooks/queries/useUser";
import Header from "../organisms/dashbord/Header";
import ChatRealtimeProvider from "@/shared/providers/ChatRealtimeProvider";
import HomeBottomNavigation from "../organisms/Home/HomeBottomNavigation";
import { usePathname } from "next/navigation";

interface DashboardTemplateProps {
  children: ReactNode;
}

const DashboardTemplate = ({ children }: DashboardTemplateProps) => {
  const { roulData } = useUser();
  const isChat = usePathname() === "/dashboard/chat";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);

      if (!mobile) {
        setMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="dashboard-safe-shell flex h-dvh min-h-0 justify-end gap-x-3 overflow-hidden bg-slate-50 md:gap-x-5">
      {roulData?.data?.roleName && (
        <Sidebar
          role={roulData?.data?.roleName}
          roles={roulData?.data?.roleNames}
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      )}

      <div className="flex min-h-0 w-full min-w-0 flex-col">
        <Header
          setCollapsed={setCollapsed}
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className={isChat
          ? "min-h-0 flex-1 overflow-hidden p-3 pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:p-4 xl:p-8"
          : "min-h-0 min-w-0 flex-1 overflow-y-auto p-3 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:p-4 sm:pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:p-4 xl:p-8"}>
          <ChatRealtimeProvider className={isChat ? "h-full min-h-0" : undefined}>{children}</ChatRealtimeProvider>
        </main>
      </div>
      <HomeBottomNavigation />
    </div>
  );
};

export default DashboardTemplate;
