"use client";
import { BookmarkIcon as OutlineBookmark } from "@heroicons/react/24/outline";
import { BookmarkIcon as SolidBookmark } from "@heroicons/react/24/solid";
import { useSavedProducts } from "@/hooks/queries/useSavedProducts";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
export default function SaveProductButton({ code, iconOnly = false }: { code: string; iconOnly?: boolean }) {
  const { query, mutation } = useSavedProducts();
  const saved = !!query.data?.some((product) => product.productCode === code);
  const Icon = saved ? SolidBookmark : OutlineBookmark;
  return <button type="button" aria-label={saved ? "حذف محصول از ذخیره‌ها" : "ذخیره محصول"} title={saved ? "حذف از ذخیره‌ها" : "ذخیره محصول"} aria-pressed={saved} disabled={mutation.isPending || query.isLoading} onClick={() => {
    if (!Cookies.get("token")) return toast.error("برای ذخیره محصول وارد حساب کاربری شوید.");
    if (query.isError) { query.refetch(); return toast.error("ذخیره‌ها دریافت نشد؛ دوباره تلاش کنید."); }
    mutation.mutate({ code, saved: !saved });
  }} className={iconOnly ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50" : `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${saved ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"}`}><Icon className={iconOnly ? "h-6 w-6" : "h-4 w-4"} />{!iconOnly && (saved ? "ذخیره‌شده" : "ذخیره محصول")}</button>;
}
