"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberReturnPath } from "@/shared/utils/authRedirect";

export default function AuthReturnTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const remember = () => rememberReturnPath(window.location.pathname + window.location.search + window.location.hash);
    remember();
    // Capture query/hash changes too, before the user follows a login link.
    document.addEventListener("click", remember, true);
    return () => document.removeEventListener("click", remember, true);
  }, [pathname]);
  return null;
}
