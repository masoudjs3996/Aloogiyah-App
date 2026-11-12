"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

type Props = {
  children: ReactNode;
};

const ReactQueryProvider = ({ children }: Props) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({ defaultOptions: {
      queries: {
        retry: (count, error) => !(isAxiosError(error) && error.response?.status === 429) && count < 1,
        refetchOnWindowFocus: query => !(isAxiosError(query.state.error) && query.state.error.response?.status === 429),
        refetchOnReconnect: query => !(isAxiosError(query.state.error) && query.state.error.response?.status === 429),
        refetchOnMount: query => !(isAxiosError(query.state.error) && query.state.error.response?.status === 429),
        retryOnMount: false,
      },
      mutations: { retry: false },
    } });
    client.setQueryDefaults(["platform", "categories"], { staleTime: 86400000, gcTime: 86400000 });
    client.setQueryDefaults(["platform", "discounted-products"], { staleTime: 180000, gcTime: 600000 });
    return client;
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      {mounted && <Toaster />}
      {children}
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
