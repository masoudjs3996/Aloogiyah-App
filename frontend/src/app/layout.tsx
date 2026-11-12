import "@styles/globals.css";

import vazirFont from "@constants/localFont";
import { ReactNode } from "react";
import type { Viewport } from "next";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };


import Providers from "./providers";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      {/* Browser extensions can add attributes to body before hydration. */}
      <body suppressHydrationWarning className={`min-h-screen ${vazirFont.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
