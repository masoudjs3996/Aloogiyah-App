"use client";
import { useEffect, useState } from "react";
import PersianDateTimeField from "./PersianDateTimeField";
import { persianInput, persianToISO } from "@/shared/utils/persian-date";
import { TextField } from "./FormField";
import { request } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import type { ProductOffer } from "@/shared/types/productOffer";

export default function ProductOfferForm({ productCode, offer }: { productCode: string; offer: ProductOffer }) {
  const [percentage, setPercentage] = useState("");
  const [endsAt, setEndsAt] = useState("");
  useEffect(() => {
    setPercentage(offer.discountPercentage ? String(offer.discountPercentage) : "");
    setEndsAt(offer.discountEndsAt ? persianInput(offer.discountEndsAt) : "");
  }, [offer.discountPercentage, offer.discountEndsAt]);
  const save = usePlatformMutation(
    (remove: boolean) => request("/AgriculturalProduct/Offer", { method: "PUT", data: {
      productCode, percentage: remove ? 0 : Number(percentage), endDate: remove ? null : persianToISO(endsAt),
    }}),
    ["product", "store-products", "discounted-products", "cart"], "تخفیف محصول ذخیره شد",
  );
  return <form className="mt-6 space-y-4 rounded-2xl border border-rose-100 bg-white p-5" onSubmit={(event) => { event.preventDefault(); save.mutate(false); }}>
    <h2 className="text-lg font-bold text-slate-800">تخفیف زمان‌دار محصول</h2>
    <p className="text-sm leading-6 text-slate-500">تخفیف روی قیمت خرده‌فروشی و همکاری اعمال می‌شود و با پایان مهلت، قیمت اصلی برمی‌گردد.</p>
    <TextField label="درصد تخفیف" type="number" min="0.01" max="100" step="0.01" required value={percentage} onChange={(event) => setPercentage(event.target.value)} />
    <PersianDateTimeField label="تاریخ و ساعت پایان (زمان محلی شما)" min={new Date().toISOString()} required value={endsAt} onChange={setEndsAt} />
    <button type="button" className="text-sm font-bold text-emerald-700" onClick={() => setEndsAt(persianInput(new Date(Date.now() + 86400000).toISOString()))}>تا همین ساعت فردا</button>
    <div className="flex gap-3">
      <button disabled={save.isPending} className="flex-1 rounded-xl bg-rose-600 px-4 py-3 font-bold text-white disabled:opacity-60">{save.isPending ? "در حال ذخیره…" : "ذخیره تخفیف"}</button>
      {!!offer.discountPercentage && <button type="button" disabled={save.isPending} onClick={() => save.mutate(true)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 disabled:opacity-60">حذف تخفیف</button>}
    </div>
  </form>;
}
