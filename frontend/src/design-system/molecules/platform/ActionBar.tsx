"use client";

import { createContext, useContext, type ReactNode } from "react";

export const ActionBarInPanel = createContext(false);

// Keep page actions above mobile navigation; panel actions stay in their scroll area.
export default function ActionBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  const inPanel = useContext(ActionBarInPanel);
  return (
    <div data-page-action-bar={!inPanel || undefined} className={`${inPanel ? "sticky bottom-0 z-10 md:static md:z-auto" : ""} w-full md:ml-0 md:mr-auto md:w-auto ${className}`}>
      <div className={`${inPanel ? "-mx-1" : "fixed inset-x-0 bottom-[calc(var(--mobile-navigation-height,0px)+env(safe-area-inset-bottom))] z-[60]"} flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.2)] [&>button]:min-h-11 [&>button]:flex-1 [&>a]:flex-1 md:static md:mx-0 md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none md:[&>button]:flex-none md:[&>button]:w-auto md:[&>a]:flex-none md:[&>a]:w-auto [&>div]:flex [&>div]:w-full [&>div]:flex-wrap [&>div]:justify-end [&>div]:gap-2 [&>div>button]:flex-1 md:[&>div]:w-auto md:[&>div>button]:flex-none`}>
        {children}
      </div>
    </div>
  );
}
