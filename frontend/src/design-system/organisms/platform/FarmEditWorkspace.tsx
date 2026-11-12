"use client";

import { useEffect, useState, useRef } from "react";
import { deliveryApi } from "@/lib/actions/delivery";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Map, { type MapPoint } from "@/design-system/organisms/dashbord/map/Map";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import type { Address } from "@/shared/types/platform";
import { amountDigits, formatAmount } from "@/shared/utils/amount";
import { request } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { TextAreaField, TextField } from "@/design-system/molecules/platform/FormField";

type Farm = {
  imageUrl?: string;
  address?: Address;
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
  const points = useQuery({queryKey:["delivery-points"],queryFn:deliveryApi.points});
  const currentPoint = useQuery({queryKey:["farm-delivery",code],queryFn:()=>request<{pointCode?:string}>(`/Delivery/FarmPoint/${encodeURIComponent(code)}`)});
  const [choice,setChoice]=useState<string>();
  const initialized = useRef(false);
  const [point,setPoint] = useState<MapPoint | null>(null);
  const [photo,setPhoto] = useState<File | null>(null);
  const [preview,setPreview] = useState("");
  useEffect(()=>{if(!photo){setPreview("");return;}const url=URL.createObjectURL(photo);setPreview(url);return ()=>URL.revokeObjectURL(url);},[photo]);
  const [form, setForm] = useState({ name: "", description: "", capacity: "", minPurchase: "" });
  useEffect(() => {
    if (farm.data && !initialized.current) { initialized.current=true; setForm({
      name: farm.data.name ?? "",
      description: farm.data.description ?? "",
      capacity: String(farm.data.capacity ?? ""),
      minPurchase: String(farm.data.minPurchase ?? 0),
    }); }
  }, [farm.data]);
  const save = usePlatformMutation(
    async (data: typeof form) => { await request("/Farm/Update", {
      method: "PUT",
      data: { code, name: data.name.trim(), description: data.description.trim(), capacity: data.capacity ? Number(data.capacity) : null, minPurchase: Number(data.minPurchase) || 0, ...(point && farm.data?.address ? {address:{...farm.data.address,addressCode:farm.data.address.code,latitude:point.lat,longitude:point.lng}} : {}) },
    });
      if (choice !== undefined && choice !== currentPoint.data?.pointCode) {
        await request(`/Delivery/FarmPoint/${encodeURIComponent(code)}`,{method:"PUT",data:{pointCode:choice}});
        await currentPoint.refetch();
      }
    },
    ["farm", "my-farms"],
    "اطلاعات مزرعه ویرایش شد",
  );

  const upload = usePlatformMutation(async (file: File) => {
    if (!file) throw new Error("ابتدا تصویر را انتخاب کنید.");
    const body=new FormData();body.append("Code",code);body.append("File",file);
    await request("/Farm/UploadImage",{method:"PATCH",data:body});setPhoto(null);
  },["farm","my-farms"],"تصویر مزرعه به‌روز شد");
  if (farm.isLoading) return <p className="p-8 text-slate-500">در حال دریافت اطلاعات مزرعه…</p>;
  if (farm.isError || !farm.data) return <p className="p-8 text-red-600">اطلاعات مزرعه دریافت نشد.</p>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/dashboard/farm/myFarms/${encodeURIComponent(code)}`} className="mb-6 inline-block text-sm font-bold text-emerald-700">← بازگشت به مزرعه</Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">ویرایش مزرعه</h1>
      <section className="mb-6 space-y-4 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">تصویر مزرعه</h2>
        {preview || farm.data.imageUrl ? <img src={preview || getImageUrl(farm.data.imageUrl)} alt="تصویر مزرعه" className="h-56 w-full rounded-xl object-cover" /> : <div className="flex h-48 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">تصویر مزرعه</div>}
        <label className="block text-sm font-medium">انتخاب تصویر جدید<input className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm" type="file" disabled={upload.isPending} accept="image/jpeg,image/png,image/webp" onChange={event=>{const file=event.target.files?.[0];if(file){setPhoto(file);upload.mutate(file);}event.target.value="";}} /></label>
        {upload.isPending && <p role="status" className="text-sm text-emerald-700">در حال بارگذاری تصویر…</p>}
      </section>
      <form className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5" onSubmit={(event) => { event.preventDefault(); save.mutate(form); }}>
        <TextField label="نام مزرعه" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <TextAreaField label="توضیحات" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <TextField label="ظرفیت مزرعه (اختیاری)" inputMode="numeric" value={formatAmount(form.capacity)} onChange={(event) => setForm({ ...form, capacity: amountDigits(event.target.value) })} />
        <TextField label="حداقل مبلغ خرید (تومان)" inputMode="numeric" value={formatAmount(form.minPurchase)} onChange={(event) => setForm({ ...form, minPurchase: amountDigits(event.target.value) })} />
        {farm.data.address && <section className="space-y-3 border-t border-slate-100 pt-5"><h2 className="font-bold">موقعیت مزرعه روی نقشه</h2><p className="text-sm text-slate-500">برای تغییر موقعیت روی نقشه کلیک کنید، سپس تغییرات را ذخیره کنید.</p><Map pickLocation position={point ? [point.lat,point.lng] : farm.data.address.latitude!=null && farm.data.address.longitude!=null ? [farm.data.address.latitude,farm.data.address.longitude] : undefined} onConfirmLocation={setPoint} className="h-[360px]" /></section>}
        <section className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4"><h2 className="font-bold">میدان تحویل سفارش‌های مزرعه</h2><p className="text-sm leading-7 text-slate-600">آگهی‌ها را به این میدان تحویل می‌دهید. انتخاب شما همراه تغییرات مزرعه ذخیره می‌شود.</p><select aria-label="میدان تحویل مزرعه" className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" value={choice ?? currentPoint.data?.pointCode ?? ""} onChange={event=>setChoice(event.target.value)} disabled={points.isPending||currentPoint.isPending}><option value="" disabled>انتخاب میدان</option>{points.data?.map(p=><option key={p.code} value={p.code}>{p.name}</option>)}</select>{(points.isError||currentPoint.isError)&&<button type="button" className="text-sm text-red-700" onClick={()=>{void points.refetch();void currentPoint.refetch();}}>دریافت میدان‌ها ناموفق بود؛ تلاش دوباره</button>}</section>
        <button disabled={save.isPending || upload.isPending || (choice !== undefined && (!choice || currentPoint.isError))} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white disabled:opacity-60">{save.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}</button>
      </form>

    </main>
  );
}

