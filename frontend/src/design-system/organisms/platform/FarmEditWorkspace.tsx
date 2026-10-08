"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { TextAreaField, TextField } from "@/design-system/molecules/platform/FormField";

type Farm = {
  code: string;
  name: string;
  description?: string;
  capacity?: number;
  minPurchase?: number;
};

export default function FarmEditWorkspace({ code }: { code: string }) {
  const farm = useQuery({
    queryKey: ["platform", "farm", code],
    queryFn: () => request<Farm>("/Farm/GetByCode", { params: { code } }),
  });
  const [form, setForm] = useState({ name: "", description: "", capacity: "", minPurchase: "" });
  useEffect(() => {
    if (farm.data) setForm({
      name: farm.data.name ?? "",
      description: farm.data.description ?? "",
      capacity: String(farm.data.capacity ?? ""),
      minPurchase: String(farm.data.minPurchase ?? 0),
    });
  }, [farm.data]);
  const save = usePlatformMutation(
    (data: typeof form) => request("/Farm/Update", {
      method: "PUT",
      data: { code, name: data.name.trim(), description: data.description.trim(), capacity: Number(data.capacity) || 0, minPurchase: Number(data.minPurchase) || 0 },
    }),
    ["farm", "my-farms"],
    "اطلاعات مزرعه ویرایش شد",
  );

  if (farm.isLoading) return <p className="p-8 text-slate-500">در حال دریافت اطلاعات مزرعه…</p>;
  if (farm.isError || !farm.data) return <p className="p-8 text-red-600">اطلاعات مزرعه دریافت نشد.</p>;
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/dashboard/farm/myFarms/${encodeURIComponent(code)}`} className="mb-6 inline-block text-sm font-bold text-emerald-700">← بازگشت به مزرعه</Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ویرایش مزرعه</h1>
      <form className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5" onSubmit={(event) => { event.preventDefault(); save.mutate(form); }}>
        <TextField label="نام مزرعه" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <TextAreaField label="توضیحات" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <TextField label="ظرفیت مزرعه" type="number" min="0" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} />
        <TextField label="حداقل مبلغ خرید (ریال)" type="number" min="0" value={form.minPurchase} onChange={(event) => setForm({ ...form, minPurchase: event.target.value })} />
        <button disabled={save.isPending} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-60">{save.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}</button>
      </form>
    </main>
  );
}
