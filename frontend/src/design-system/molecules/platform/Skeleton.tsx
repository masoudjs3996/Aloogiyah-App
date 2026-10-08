import type { ReactNode } from "react";

export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <SkeletonBlock className="h-36 w-full rounded-xl sm:h-44" />
      <div className="space-y-3 p-2 pt-4">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, products = false }: { count?: number; products?: boolean }) {
  return (
    <div className={products ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

function RowList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4"
        >
          <SkeletonBlock className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-3 w-full max-w-lg" />
          </div>
          <SkeletonBlock className="hidden h-9 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}

function DetailPanel() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SkeletonBlock className="h-64 w-full rounded-2xl sm:h-80" />
      <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
        <SkeletonBlock className="h-6 w-2/3" />
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-12 w-1/2" />
        <SkeletonBlock className="h-24 w-full" />
        <SkeletonBlock className="h-11 w-full sm:w-1/2" />
      </div>
    </div>
  );
}

function FormPanel() {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
      <SkeletonBlock className="h-6 w-1/2" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBlock className="h-3 w-1/3" />
            <SkeletonBlock className="h-11 w-full" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="h-11 w-full sm:w-40" />
    </div>
  );
}

function StatGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5">
          <SkeletonBlock className="mb-4 h-10 w-10 rounded-xl" />
          <SkeletonBlock className="mb-3 h-3 w-1/2" />
          <SkeletonBlock className="h-7 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-1 py-2 sm:px-0">
      <div className="space-y-3">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-full max-w-md" />
      </div>
      {children}
    </div>
  );
}

export function SkeletonView({
  variant = "cards",
}: {
  variant?: "cards" | "products" | "rows" | "detail" | "form" | "stats" | "page" | "chat" | "inline";
}) {
  if (variant === "inline") return <SkeletonBlock className="h-8 w-20" />;
  if (variant === "products") return <CardGridSkeleton products />;
  if (variant === "rows") return <RowList />;
  if (variant === "detail") return <DetailPanel />;
  if (variant === "form") return <FormPanel />;
  if (variant === "stats") return <StatGrid />;
  if (variant === "page")
    return (
      <PageFrame>
        <StatGrid />
        <CardGridSkeleton />
      </PageFrame>
    );
  if (variant === "chat")
    return (
      <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <SkeletonBlock className="h-4 flex-1" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
          <SkeletonBlock className="h-10 w-1/2" />
          <SkeletonBlock className="h-16 w-3/4" />
          <SkeletonBlock className="h-16 w-2/3" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
      </div>
    );
  return <CardGridSkeleton />;
}
