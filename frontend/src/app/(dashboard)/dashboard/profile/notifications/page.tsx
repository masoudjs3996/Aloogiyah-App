"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  GetNotificationPreferences,
  UpdateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/actions/notifications";

const defaults: NotificationPreferences = {
  orderNotificationsEnabled: true,
  serviceRequestNotificationsEnabled: true,
  generalNotificationsEnabled: true,
};

const options: { key: keyof NotificationPreferences; title: string; description: string }[] = [
  {
    key: "orderNotificationsEnabled",
    title: "سفارش و پرداخت",
    description: "ثبت سفارش، پرداخت، تغییر وضعیت، ارسال و یادآوری تحویل",
  },
  {
    key: "serviceRequestNotificationsEnabled",
    title: "درخواست خدمات و کارشناس",
    description: "ثبت درخواست، انتخاب کارشناس، تغییر وضعیت و زمان خدمت",
  },
  {
    key: "generalNotificationsEnabled",
    title: "اعلان‌های عمومی",
    description: "پیام‌ها و اعلان‌های عمومی سامانه",
  },
];

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: GetNotificationPreferences,
  });
  const [preferences, setPreferences] = useState(defaults);

  useEffect(() => {
    if (query.data) setPreferences(query.data);
  }, [query.data]);

  const save = useMutation({
    mutationFn: UpdateNotificationPreferences,
    onSuccess: (updated) => {
      setPreferences(updated);
      queryClient.setQueryData(["notification-preferences"], updated);
      toast.success("تنظیمات اعلان‌ها ذخیره شد.");
    },
    onError: () => toast.error("ذخیره تنظیمات انجام نشد. دوباره تلاش کنید."),
  });

  if (query.isLoading) {
    return <div className="mx-auto max-w-3xl p-6 text-center text-slate-500">در حال دریافت تنظیمات…</div>;
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center text-rose-700">
        دریافت تنظیمات اعلان‌ها انجام نشد.
        <button type="button" onClick={() => void query.refetch()} className="ms-2 font-bold underline">تلاش دوباره</button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-black text-slate-900">مدیریت اعلان‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">انتخاب کنید اعلان‌های هر بخش را دریافت کنید یا نه.</p>
      </header>

      <section className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5">
        {options.map((option) => (
          <label key={option.key} className="flex cursor-pointer items-center justify-between gap-5 py-5">
            <span>
              <span className="block font-bold text-slate-800">{option.title}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">{option.description}</span>
            </span>
            <input
              type="checkbox"
              checked={preferences[option.key]}
              onChange={(event) => setPreferences((current) => ({ ...current, [option.key]: event.target.checked }))}
              className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              aria-label={option.title}
            />
          </label>
        ))}
      </section>

      <button
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate(preferences)}
        className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {save.isPending ? "در حال ذخیره…" : "ذخیره تنظیمات"}
      </button>
    </main>
  );
}
