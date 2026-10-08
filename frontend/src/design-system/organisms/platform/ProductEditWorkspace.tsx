"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { TextAreaField, TextField } from "@/design-system/molecules/platform/FormField";

type Product = {
  code: string;
  name: string;
  description?: string;
  retailPrice: number;
  wholesalePrice?: number;
  stock: number;
  dailyProductionCapacity?: number;
  greenhouseCode?: string;
  statusCode: string;
  categoryCodes?: string[];
};

export default function ProductEditWorkspace({ farmCode, productCode }: { farmCode: string; productCode: string }) {
  const product = useQuery({
    queryKey: ["platform", "product", productCode],
    queryFn: () => request<Product>("/AgriculturalProduct/GetByCode", { params: { code: productCode } }),
  });
  const [form, setForm] = useState<Product | null>(null);
  useEffect(() => {
    if (product.data) setForm(product.data);
  }, [product.data]);
  const save = usePlatformMutation(
    (data: Product) => request("/AgriculturalProduct/Update", {
      method: "PUT",
      data: {
        code: productCode,
        name: data.name.trim(),
        description: data.description ?? "",
        greenhouseCode: data.greenhouseCode || farmCode,
        retailPrice: Number(data.retailPrice),
        wholesalePrice: data.wholesalePrice == null ? null : Number(data.wholesalePrice),
        stock: Number(data.stock),
        dailyProductionCapacity: data.dailyProductionCapacity == null ? null : Number(data.dailyProductionCapacity),
        statusCode: data.statusCode,
        slug: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        categoryCodes: data.categoryCodes ?? [],
      },
    }),
    ["store-products", "product"],
    "اطلاعات محصول ویرایش شد",
  );
  if (product.isLoading || !form) return <p className="p-8 text-slate-500">در حال دریافت اطلاعات محصول…</p>;
  if (product.isError) return <p className="p-8 text-red-600">اطلاعات محصول دریافت نشد.</p>;
  const update = (key: keyof Product, value: string) => setForm({ ...form, [key]: value });
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/dashboard/farm/myFarms/${encodeURIComponent(farmCode)}/farmProducts`} className="mb-6 inline-block text-sm font-bold text-emerald-700">← بازگشت به محصولات مزرعه</Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ویرایش محصول</h1>
      <form className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5" onSubmit={(event) => { event.preventDefault(); save.mutate(form); }}>
        <TextField label="نام محصول" required value={form.name} onChange={(event) => update("name", event.target.value)} />
        <TextAreaField label="توضیحات" value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} />
        <TextField label="قیمت خرده‌فروشی (ریال)" type="number" min="0" required value={form.retailPrice} onChange={(event) => update("retailPrice", event.target.value)} />
        <TextField label="قیمت عمده‌فروشی (ریال)" type="number" min="0" value={form.wholesalePrice ?? ""} onChange={(event) => update("wholesalePrice", event.target.value)} />
        <TextField label="موجودی" type="number" min="0" required value={form.stock} onChange={(event) => update("stock", event.target.value)} />
        <TextField label="ظرفیت تولید روزانه" type="number" min="0" value={form.dailyProductionCapacity ?? ""} onChange={(event) => update("dailyProductionCapacity", event.target.value)} />
        <button disabled={save.isPending} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-60">{save.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}</button>
      </form>
    </main>
  );
}
