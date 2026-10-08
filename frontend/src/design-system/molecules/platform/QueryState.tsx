import type { ReactNode } from "react";
import {
  ExclamationTriangleIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { errorMessage } from "@/lib/actions/platform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { SkeletonView } from "./Skeleton";
export default function QueryState({
  loading,
  error,
  empty,
  retry,
  children,
  emptyText = "هنوز اطلاعاتی ثبت نشده است",
  skeleton = "cards",
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  retry?: () => void;
  children?: ReactNode;
  emptyText?: string;
  skeleton?: "cards" | "products" | "rows" | "detail" | "form" | "stats" | "page" | "chat" | "inline";
}) {
  if (loading)
    return (
      <div
        role="status"
        aria-label="در حال دریافت اطلاعات"
        className="w-full"
      >
        <SkeletonView variant={skeleton} />
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center"
      >
        <ExclamationTriangleIcon className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="mb-4 text-sm text-red-700">{errorMessage(error)}</p>
        {retry && (
          <ActionButton variant="secondary" onClick={retry}>
            تلاش دوباره
          </ActionButton>
        )}
      </div>
    );
  if (empty)
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <InboxIcon className="mx-auto mb-4 h-12 w-12 text-emerald-300" />
        <p className="text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  return <>{children}</>;
}
