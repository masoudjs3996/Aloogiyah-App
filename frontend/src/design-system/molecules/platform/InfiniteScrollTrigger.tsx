"use client";

import { useEffect, useRef } from "react";

type InfiniteScrollTriggerProps = {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  label: string;
};

export default function InfiniteScrollTrigger({
  hasNextPage,
  isFetching,
  onLoadMore,
  label,
}: InfiniteScrollTriggerProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  const requestStartedRef = useRef(false);

  loadMoreRef.current = onLoadMore;

  useEffect(() => {
    if (!isFetching) requestStartedRef.current = false;
    if (!hasNextPage || isFetching || !targetRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || requestStartedRef.current) return;
        requestStartedRef.current = true;
        loadMoreRef.current();
      },
      { rootMargin: "500px 0px" },
    );

    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching]);

  if (!hasNextPage) return null;

  return (
    <div
      ref={targetRef}
      className="flex min-h-12 items-center justify-center py-3"
      role="status"
      aria-live="polite"
    >
      {isFetching && (
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700"
          />
          {label}
        </span>
      )}
    </div>
  );
}
