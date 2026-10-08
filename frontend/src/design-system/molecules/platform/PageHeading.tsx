import type { ReactNode } from "react";
import Link from "next/link";
export default function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <Link href="/dashboard" className="mb-2 block text-xs text-emerald-700">
          الو گیاه / حساب کاربری
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
