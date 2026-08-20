"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "../organisms/dashbord/Sidebar";
import { useUser } from "@/hooks/queries/useUser";
import Header from "../organisms/dashbord/Header";

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
    <div className="flex h-screen justify-end py-2 gap-x-10">
      {roulData?.data?.roleName && (
        <Sidebar
          role={roulData?.data?.roleName}
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      )}

      <div className="flex flex-col w-full min-w-0">
        <Header
          setCollapsed={setCollapsed}
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardTemplate;
