"use client";
import QueryState from "@/design-system/molecules/platform/QueryState";
export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) { return <QueryState error={new Error("بارگیری این صفحه انجام نشد")} retry={reset} />; }
