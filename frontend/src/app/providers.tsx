"use client";

import ReactQueryProvider from "@/shared/providers/QueryProvider";
import ReactQueryDevtoolsClient from "@/shared/providers/ReactQueryDevtoolsClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      {children}
      <ReactQueryDevtoolsClient />
    </ReactQueryProvider>
  );
}
