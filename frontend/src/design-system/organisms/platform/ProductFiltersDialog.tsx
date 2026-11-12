"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformApi, request } from "@/lib/actions/platform";
import { SpecificationOptionField, type ListingTemplate } from "@/design-system/molecules/platform/ListingSpecificationFields";
import { Dialog, DialogPanel, DialogTitle, Switch } from "@headlessui/react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import type { ICategoryTree } from "@/shared/types/categories";
import {
  emptyProductFilters,
  categoryFilterCodes,
  productSortOptions,
  validateProductFilters,
  type ProductFilters,
} from "@/shared/utils/product-filters";
import CategoryPicker from "@/design-system/molecules/platform/CategoryPicker";
import PriceRangeField from "@/design-system/molecules/platform/PriceRangeField";

export default function ProductFiltersDialog({
  value,
  categories,
  loading,
  categoryError,
  onRetry,
  onApply,
  onClose,
}: {
  value: ProductFilters;
  categories: ICategoryTree[];
  loading: boolean;
  categoryError: boolean;
  onRetry: () => void;
  onApply: (value: ProductFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const categoryCodes = categoryFilterCodes(categories, draft.category);
  const provinces = useQuery({ queryKey: ["provinces"], queryFn: platformApi.provinces });
  const counties = useQuery({
    queryKey: ["counties", draft.provinceCode],
    queryFn: () => platformApi.counties(draft.provinceCode),
    enabled: !!draft.provinceCode,
  });
  const locations = useQuery({
    queryKey: ["locations", draft.countyCode],
    queryFn: () => platformApi.countyLocations(draft.countyCode),
    enabled: !!draft.countyCode,
  });
  const retryLocations = () => {
    for (const query of [provinces, counties, locations]) {
      if (query.isError) void query.refetch();
    }
  };
  const templates = useQuery({
    queryKey: ["listing-filter-templates", categoryCodes],
    queryFn: ({ signal }) => request<ListingTemplate[]>("/AgriculturalProductTemplate", {
      params: { categoryCodes }, paramsSerializer: { indexes: null }, signal,
    }),
    enabled: !!categoryCodes?.length,
  });
  const choices = templates.data ?? [];
  const template = choices.find(item => item.code === draft.templateCode) ?? (choices.length === 1 ? choices[0] : undefined);
  const selectClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm";
  return (
    <Dialog open onClose={onClose} className="relative z-[80]" dir="rtl">
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-5">
        <DialogPanel className="flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <DialogTitle className="flex-1 text-lg font-black text-slate-800">
              فیلتر و مرتب‌سازی
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن فیلترها"
              className="rounded-xl p-3 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              const message = validateProductFilters(draft);
              setError(message);
              if (!message) onApply(draft);
            }}
          >
            <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-slate-800">
                  مرتب‌سازی بر اساس
                </legend>
                <div className="flex flex-wrap gap-2">
                  {productSortOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${draft.sort === option.value ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                    >
                      <input
                        type="radio"
                        name="product-sort"
                        value={option.value}
                        checked={draft.sort === option.value}
                        onChange={() =>
                          setDraft({ ...draft, sort: option.value })
                        }
                        className="sr-only peer"
                      />
                      <span className="inline-flex items-center gap-1 rounded peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-emerald-700">
                        {draft.sort === option.value && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <CategoryPicker
                  categories={categories}
                  value={draft.category}
                  onChange={(category) => setDraft({ ...draft, category, templateCode: "", specificationOptions: {} })}
                  loading={loading}
                  error={categoryError}
                  onRetry={onRetry}
                />
              </div>
              {draft.category && templates.isLoading && <p role="status" className="text-sm text-slate-600">در حال دریافت مشخصات دسته…</p>}
              {templates.isError && <button type="button" onClick={() => void templates.refetch()} className="text-sm text-rose-700">دریافت مشخصات ناموفق بود. تلاش دوباره</button>}
              {(choices.length > 1 || !!template?.specifications.length) && (
                <fieldset className="grid gap-3">
                  <legend className="mb-3 text-sm font-bold">مشخصات آگهی</legend>
                  {choices.length > 1 && (
                    <label className="grid gap-2 text-sm">
                      نوع آگهی
                      <select className={selectClass} value={draft.templateCode} onChange={event => setDraft({ ...draft, templateCode: event.target.value, specificationOptions: {} })}>
                        <option value="">همهٔ نوع‌ها</option>
                        {choices.map(item => <option key={item.code} value={item.code}>{item.name}{choices.some(other => other.code !== item.code && other.name === item.name) && ` — ${item.categoryName}`}</option>)}
                      </select>
                    </label>
                  )}
                  {template?.specifications.filter(field => field.options.length > 0).map(field => (
                    <SpecificationOptionField key={field.code} label={field.name} options={field.options} emptyLabel="همهٔ گزینه‌ها"
                      value={draft.specificationOptions[field.code] ?? ""}
                      onChange={value => setDraft({ ...draft, specificationOptions: { ...draft.specificationOptions, [field.code]: value } })} />
                  ))}
                </fieldset>
              )}
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-bold">موقعیت مزرعه</legend>
                  <label className="grid gap-2 text-sm">
                    استان
                    <select className={selectClass} value={draft.provinceCode} disabled={provinces.isLoading}
                      onChange={event => {
                        const code = event.target.value;
                        setDraft({ ...draft, provinceCode: code, countyCode: "", localityCode: "" });
                      }}>
                      <option value="">همهٔ استان‌ها</option>
                      {provinces.data?.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
                    </select>
                  </label>
                  {draft.provinceCode && <label className="grid gap-2 text-sm">
                    شهرستان
                    <select className={selectClass} value={draft.countyCode} disabled={counties.isLoading}
                      onChange={event => {
                        const code = event.target.value;
                        setDraft({ ...draft, countyCode: code, localityCode: "" });
                      }}>
                      <option value="">همهٔ شهرستان‌ها</option>
                      {counties.data?.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
                    </select>
                  </label>}
                  {draft.countyCode && <label className="grid gap-2 text-sm">
                    شهر یا روستا
                    <select className={selectClass} value={draft.localityCode} disabled={locations.isLoading}
                      onChange={event => {
                        const code = event.target.value;
                        setDraft({ ...draft, localityCode: code });
                      }}>
                      <option value="">همهٔ شهرها و روستاها</option>
                      {locations.data?.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
                    </select>
                  </label>}
                {(provinces.isLoading || counties.isLoading || locations.isLoading) && <p role="status" className="text-sm text-slate-600">در حال دریافت شهرها…</p>}
                {(provinces.isError || counties.isError || locations.isError) && <button type="button" onClick={retryLocations} className="text-sm text-rose-700">دریافت موقعیت‌ها ناموفق بود. تلاش دوباره</button>}
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-slate-800">
                  بازه قیمت{" "}
                  <span className="font-normal text-slate-400">(تومان)</span>
                </legend>
                <PriceRangeField
                  minPrice={draft.minPrice}
                  maxPrice={draft.maxPrice}
                  onChange={(prices) => setDraft({ ...draft, ...prices })}
                />
              </fieldset>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 px-4">
                {(
                  [
                    { key: "stockOnly", title: "فقط آگهی‌های موجود" },
                  ] as const
                ).map((option) => (
                  <div
                    key={option.key}
                    className="flex items-center justify-between gap-4 py-4 text-sm font-semibold text-slate-700"
                  >
                    {option.title}
                    <Switch
                      aria-label={option.title}
                      checked={draft[option.key]}
                      onChange={(checked) =>
                        setDraft({
                          ...draft,
                          [option.key]: checked,
                        })
                      }
                      className="group inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-slate-200 p-1 transition-colors data-[checked]:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
                      dir="ltr"
                    >
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform group-data-[checked]:translate-x-5"
                      />
                    </Switch>
                  </div>
                ))}
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...emptyProductFilters });
                  setError("");
                }}
                className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                پاک‌کردن
              </button>
              <button
                type="submit"
                className="min-h-12 flex-1 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800"
              >
                اعمال و نمایش آگهی‌ها
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
