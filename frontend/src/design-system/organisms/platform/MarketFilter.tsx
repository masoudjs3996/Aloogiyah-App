"use client";
import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { deliveryApi } from "@/lib/actions/delivery";
import { errorMessage } from "@/lib/actions/platform";
import { inputClass, SelectField, TextField } from "@/design-system/molecules/platform/FormField";

export default function MarketFilter({ pointCode, localOnly, onChange }: {
  pointCode: string; localOnly: boolean; onChange: (point: string, local: boolean) => void;
}) {
  const q = useQuery({ queryKey: ["public-delivery-points"], queryFn: deliveryApi.points, staleTime: 60000 });
  const [search, setSearch] = useState("");
  const id = useId();
  const normalize = (s: string) => s.replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase().trim();
  const matches = (q.data ?? []).filter(p => normalize([p.name, p.countyName, p.address].join(" ")).includes(normalize(search)));
  const selected = q.data?.find(p => p.code === pointCode);
  return <div className="space-y-3 rounded-2xl border border-slate-100 p-4">
    <Popover className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">میدان بار</label>
      <PopoverButton id={id} type="button" className={`${inputClass} flex items-center justify-between gap-2`} onClick={() => setSearch("")}>
        <span className="truncate">{selected ? [selected.name, selected.countyName].filter(Boolean).join(" — ") : "همه میدان‌ها"}</span>
        <span aria-hidden="true">⌄</span>
      </PopoverButton>
      <PopoverPanel className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {({ close }) => <>
          <TextField label="جست‌وجوی میدان بار" placeholder="نام شهر یا میدان بار" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="mt-3 max-h-48 overflow-y-auto" aria-live="polite">
            <button type="button" aria-pressed={!pointCode} className="w-full rounded-lg px-3 py-2.5 text-right text-sm hover:bg-emerald-50" onClick={() => { onChange("", true); close(); }}>همه میدان‌ها</button>
            {q.isPending ? <p role="status" className="p-3 text-sm">در حال دریافت میدان‌ها…</p>
              : q.error ? <p role="alert" className="p-3 text-sm">{errorMessage(q.error)} <button type="button" onClick={() => void q.refetch()}>تلاش دوباره</button></p>
              : matches.length ? matches.map(p => <button key={p.code} type="button" aria-pressed={p.code === pointCode} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-right text-sm hover:bg-emerald-50 focus-visible:outline-emerald-600" onClick={() => { onChange(p.code, true); close(); }}>
                <span>{[p.name, p.countyName].filter(Boolean).join(" — ")}</span><span aria-hidden="true">{p.code === pointCode ? "✓" : ""}</span>
              </button>) : <p role="status" className="p-3 text-sm">میدانی با این مشخصات پیدا نشد.</p>}
          </div>
        </>}
      </PopoverPanel>
    </Popover>
    {!!pointCode && <SelectField label="محصولات نمایش‌داده‌شده" value={localOnly ? "local" : "all"} onChange={e => onChange(pointCode, e.target.value === "local")}>
      <option value="local">محصولات با مبدأ همین میدان</option><option value="all">همه محصولات قابل دریافت در این میدان</option>
    </SelectField>}
    <p className="text-xs leading-6 text-slate-500">بار پس از ثبت سفارش به میدان می‌رسد. انتقال از میدان دیگر، هزینه و زمان جدا دارد.</p>
  </div>;
}
