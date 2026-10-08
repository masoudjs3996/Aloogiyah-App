import type { ButtonHTMLAttributes } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
export default function ActionButton({
  children,
  busy = false,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 ${variant === "primary" ? "bg-emerald-700 text-white hover:bg-emerald-800" : variant === "danger" ? "bg-red-50 text-red-700 hover:bg-red-100" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"} ${className}`}
      {...props}
    >
      {busy && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
