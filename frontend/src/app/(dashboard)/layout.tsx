import DashboardTemolate from "@/design-system/templates/DashboardTemplate";
import { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <DashboardTemolate>{children}</DashboardTemolate>;
}
