import "@styles/globals.css";
// import "leaflet/dist/leaflet.css";
// import "leaflet-defaulticon-compatibility";
// import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import vazirFont from "@constants/localFont";
import { ReactNode } from "react";


import Providers from "./providers";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`min-h-screen ${vazirFont.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
