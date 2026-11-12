"use client";

import { useId } from "react";
import SpecificationMark, { type SpecificationAppearance } from "./SpecificationMark";

type ListingOption = { code: string; label: string } & SpecificationAppearance;

export type ListingTemplate = {
  code: string;
  name: string;
  categoryName: string;
  defaultSaleUnit?: string | null;
  specifications: {
    code: string;
    name: string;
    isRequired: boolean;
    options: ListingOption[];
  }[];
};

export function SpecificationOptionField({ label, options, value, onChange, required = false, emptyLabel = "بدون انتخاب" }: {
  label: string; options: ListingOption[]; value: string; onChange: (value: string) => void; required?: boolean; emptyLabel?: string;
}) {
  const name = useId();
  const selected = options.some(option => option.code === value) ? value : "";
  if (!options.some(option => option.colorHex || option.icon)) {
    return <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      <select className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm" required={required} value={selected} onChange={e => onChange(e.target.value)}>
        <option value="" disabled={required}>{required ? "انتخاب کنید" : emptyLabel}</option>
        {options.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}
      </select>
    </label>;
  }
  const choices = required ? options : [{ code: "", label: emptyLabel }, ...options];
  return <fieldset className="min-w-0">
    <legend className="mb-2 text-sm font-medium">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {choices.map(option => <label key={option.code} className="min-w-0 max-w-full cursor-pointer">
        <input type="radio" name={name} value={option.code} checked={selected === option.code} required={required} onChange={() => onChange(option.code)} className="peer sr-only" />
        <span className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-focus-visible:outline-2 peer-focus-visible:outline-emerald-700">
          <SpecificationMark {...option} /><span className="min-w-0 break-words">{option.label}</span>
        </span>
      </label>)}
    </div>
  </fieldset>;
}

export default function ListingSpecificationFields({
  templates,
  templateCode,
  values,
  onTemplateChange,
  onValueChange,
}: {
  templates: ListingTemplate[];
  templateCode: string;
  values: Record<string, string>;
  onTemplateChange: (code: string) => void;
  onValueChange: (code: string, value: string) => void;
}) {
  if (!templates.length) return null;
  const selected = templates.find(template => template.code === templateCode);
  const selectClass = "min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";
  return (
    <fieldset className="w-full min-w-0 max-w-full rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 sm:p-4">
      <legend className="px-1 text-sm font-bold text-emerald-900">نوع و مشخصات آگهی</legend>
      <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-800">
        نوع محصول *
        <select className={selectClass} required value={selected?.code || ""} onChange={event => onTemplateChange(event.target.value)}>
          <option value="" disabled>نوع محصول را انتخاب کنید</option>
          {templates.map(template => (
            <option key={template.code} value={template.code}>
              {template.name}{templates.some(other => other.code !== template.code && other.name === template.name) && ` — ${template.categoryName}`}
            </option>
          ))}
        </select>
      </label>
      {selected && <p className="mt-2 text-xs leading-6 text-slate-600 [overflow-wrap:anywhere]">دسته‌بندی آگهی · {selected.categoryName}</p>}
      {!!selected?.specifications.length && (
        <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
          {selected.specifications.map(field => (
            <SpecificationOptionField key={field.code} label={field.name + (field.isRequired ? " *" : " (اختیاری)")}
              options={field.options} required={field.isRequired} value={values[field.code] ?? ""}
              onChange={value => onValueChange(field.code, value)} />
          ))}
        </div>
      )}
    </fieldset>
  );
}
