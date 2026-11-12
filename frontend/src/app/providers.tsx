"use client";

import AuthInitializer from "@/shared/providers/AuthInitializer";
import ReactQueryProvider from "@/shared/providers/QueryProvider";
import ReactQueryDevtoolsClient from "@/shared/providers/ReactQueryDevtoolsClient";
import StoreProvider from "@/shared/providers/StoreProvider";
import AuthReturnTracker from "@/shared/providers/AuthReturnTracker";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <StoreProvider>
        <AuthInitializer />
        <AuthReturnTracker />

        {children}
        <ReactQueryDevtoolsClient />
      </StoreProvider>
    </ReactQueryProvider>
  );
}
