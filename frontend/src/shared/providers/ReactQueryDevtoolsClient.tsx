"use client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function ReactQueryDevtoolsClient() {
  return <ReactQueryDevtools initialIsOpen={false} />;
}
