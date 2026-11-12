"use client";
import SaleUnitField from "@/design-system/molecules/platform/SaleUnitField";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { TextAreaField, TextField } from "@/design-system/molecules/platform/FormField";
import ActionBar from "@/design-system/molecules/platform/ActionBar";
import ListingSpecificationFields, { type ListingTemplate } from "@/design-system/molecules/platform/ListingSpecificationFields";
import toast from "react-hot-toast";

type SpecificationValue = {
  specificationCode: string;
  specificationName?: string;
  optionCode: string;
  optionLabel?: string;
};

type Product = {
  saleUnit?: string | null;
  code: string;
  name: string;
  description?: string;
  retailPrice: number;
  stock: number;
  dailyProductionCapacity?: number;
  greenhouseCode?: string;
  statusCode: string;
  productTemplateCode?: string | null;
  productTemplateName?: string | null;
  specifications?: SpecificationValue[];
};

export default function ProductEditWorkspace({ farmCode, productCode }: { farmCode: string; productCode: string }) {
  const product = useQuery({
    queryKey: ["platform", "product", productCode],
    queryFn: () => request<Product>("/AgriculturalListing/GetByCode", { params: { code: productCode } }),
  });
  const [form, setForm] = useState<Product | null>(null);
  useEffect(() => {
    if (product.data) setForm(product.data);
  }, [product.data]);
  const templates = useQuery({
    queryKey: ["product-templates", "all"],
    queryFn: () => request<ListingTemplate[]>("/AgriculturalProductTemplate"),
  });
  const selectedTemplate = templates.data?.find((template) => template.code === form?.productTemplateCode);
  const save = usePlatformMutation(
    (data: Product) => request("/AgriculturalListing/Update", {
      method: "PUT",
      data: {
        code: productCode,
        name: data.name.trim(),
        description: data.description ?? "",
        greenhouseCode: data.greenhouseCode || farmCode,
        retailPrice: Number(data.retailPrice),
        saleUnit: data.saleUnit, stock: Number(data.stock),
        dailyProductionCapacity: data.dailyProductionCapacity == null || String(data.dailyProductionCapacity) === "" ? null : Number(data.dailyProductionCapacity),
        slug: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        productTemplateCode: data.productTemplateCode || null,
        specifications: (data.specifications ?? []).map((specification) => ({
          specificationCode: specification.specificationCode,
          optionCode: specification.optionCode,
        })),
      },
    }),
    ["store-products", "product"],
    "اطلاعات محصول ویرایش شد",
  );
  if (product.isError) return <p className="p-8 text-red-600">اطلاعات محصول دریافت نشد.</p>;
  if (product.isLoading || !form) return <p className="p-8 text-slate-500">در حال دریافت اطلاعات محصول…</p>;
  const saleUnit = form.saleUnit || selectedTemplate?.defaultSaleUnit || "";
  const update = (key: keyof Product, value: string) => setForm({ ...form, [key]: value });
  const updateTemplate = (templateCode: string) => {
    setForm({ ...form, productTemplateCode: templateCode || null, specifications: [] });
  };
  const updateSpecification = (specificationCode: string, optionCode: string) => {
    const existing = form.specifications?.filter((value) => value.specificationCode !== specificationCode) ?? [];
    setForm({
      ...form,
      specifications: optionCode
        ? [...existing, { specificationCode, optionCode }]
        : existing,
    });
  };
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/dashboard/farm/myFarms/${encodeURIComponent(farmCode)}/farmProducts`} className="mb-6 inline-block text-sm font-bold text-emerald-700">← بازگشت به آگهی‌های مزرعه</Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ویرایش آگهی</h1>
      <form className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5" onSubmit={(event) => {
        event.preventDefault();
        if (!templates.data) {
          toast.error("ابتدا منتظر دریافت مشخصات محصول بمانید.");
          return;
        }
        if (!selectedTemplate) {
          toast.error("نوع محصول را انتخاب کنید.");
          return;
        }
        const specifications = (form.specifications ?? []).filter(value =>
          selectedTemplate?.specifications.some(field => field.code === value.specificationCode && field.options.some(option => option.code === value.optionCode)));
        if (selectedTemplate?.specifications.some(field => field.isRequired && !specifications.some(value => value.specificationCode === field.code))) {
          toast.error("همه مشخصات اجباری نوع محصول را انتخاب کنید.");
          return;
        }
        save.mutate({ ...form, saleUnit, productTemplateCode: selectedTemplate?.code ?? null, specifications });
      }}>
        <SaleUnitField value={saleUnit} onChange={value => update("saleUnit", value)} /><TextField label="نام آگهی" required value={form.name} onChange={(event) => update("name", event.target.value)} />
        {templates.isLoading && <p role="status" className="text-sm text-slate-600">در حال دریافت نوع محصول…</p>}
        {templates.isError && <button type="button" onClick={() => void templates.refetch()} className="text-sm font-bold text-red-700">دریافت مشخصات ناموفق بود. تلاش دوباره</button>}
        {templates.isSuccess && !templates.data.length && <p className="text-sm text-slate-600">هنوز نوع محصول فعالی برای ثبت آگهی تعریف نشده است.</p>}
        <ListingSpecificationFields
          templates={templates.data ?? []}
          templateCode={form.productTemplateCode ?? ""}
          values={Object.fromEntries((form.specifications ?? []).map(value => [value.specificationCode, value.optionCode]))}
          onTemplateChange={updateTemplate}
          onValueChange={updateSpecification}
        />
        <TextAreaField label="توضیحات" value={form.description ?? ""} onChange={(event) => update("description", event.target.value)} />
        <TextField label="قیمت هر واحد (تومان)" type="number" min="0" step="0.01" required value={form.retailPrice} onChange={(event) => update("retailPrice", event.target.value)} />
        <TextField label="موجودی" type="number" min="0" required value={form.stock} onChange={(event) => update("stock", event.target.value)} />
        <TextField label="ظرفیت تولید روزانه" type="number" min="0" value={form.dailyProductionCapacity ?? ""} onChange={(event) => update("dailyProductionCapacity", event.target.value)} />
        <ActionBar><button disabled={save.isPending} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-60">{save.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></ActionBar>
      </form>
    </main>
  );
}
