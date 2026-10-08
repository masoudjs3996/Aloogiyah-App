"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "../organisms/dashbord/Sidebar";
import { useUser } from "@/hooks/queries/useUser";
import Header from "../organisms/dashbord/Header";
import ChatRealtimeProvider from "@/shared/providers/ChatRealtimeProvider";

interface DashboardTemplateProps {
  children: ReactNode;
}

const DashboardTemplate = ({ children }: DashboardTemplateProps) => {
  const { roulData } = useUser();

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
    <div className="flex h-dvh min-h-0 justify-end gap-x-3 overflow-hidden bg-slate-50 p-2 md:gap-x-5">
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
        <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-8">
          <ChatRealtimeProvider>{children}</ChatRealtimeProvider>
        </main>
      </div>
    </div>
  );
};

export default DashboardTemplate;
