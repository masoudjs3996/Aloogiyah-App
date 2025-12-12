import HomeTemplate from "@/design-system/templates/HomeTemplate";
import { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return <HomeTemplate>{children}</HomeTemplate>;
}
