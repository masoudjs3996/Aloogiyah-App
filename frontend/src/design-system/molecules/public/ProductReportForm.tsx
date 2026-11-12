"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { errorMessage, request } from "@/lib/actions/platform";

export default function ProductReportForm({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const report = useMutation({
    mutationFn: () => request<{ alreadyPending: boolean }>(`/ProductReport/${encodeURIComponent(code)}`, {
      method: "POST",
      data: { reason: reason.trim() },
    }),
    onSuccess: ({ alreadyPending }) => {
      toast.success(alreadyPending ? "گزارش قبلی شما در انتظار بررسی است." : "گزارش برای بررسی ثبت شد.");
      setReason("");
      setOpen(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!open) return (
    <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700" onClick={() => {
      if (!Cookies.get("token")) return toast.error("برای گزارش آگهی وارد حساب کاربری شوید.");
      setOpen(true);
    }}>
      <Flag className="h-4 w-4 shrink-0" aria-hidden="true" />
      گزارش آگهی
    </button>
  );

  return (
    <form className="order-last w-full space-y-3 rounded-xl border border-slate-200 p-4" onSubmit={(event) => {
      event.preventDefault();
      if (!report.isPending && reason.trim().length >= 5) report.mutate();
    }}>
      <label className="block text-sm font-medium">
        دلیل گزارش آگهی
        <textarea
          className="mt-2 block w-full rounded-xl border border-slate-200 p-3"
          rows={3}
          required
          minLength={5}
          maxLength={1000}
          placeholder="مثلاً تصویر یا توضیحات گمراه‌کننده است."
          value={reason}
          disabled={report.isPending}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm text-white disabled:opacity-50" disabled={report.isPending || reason.trim().length < 5}>
          {report.isPending ? "در حال ارسال…" : "ارسال گزارش"}
        </button>
        <button type="button" className="min-h-11 px-4 text-sm text-slate-600" disabled={report.isPending} onClick={() => setOpen(false)}>انصراف</button>
      </div>
    </form>
  );
}
