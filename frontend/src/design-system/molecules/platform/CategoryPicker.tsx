"use client";

import { useId, useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { ICategoryTree } from "@/shared/types/categories";
import { inputClass, TextField } from "./FormField";

function findPath(nodes: ICategoryTree[], code: string): ICategoryTree[] {
  for (const node of nodes) {
    if (node.code === code) return [node];
    const path = findPath(node.subCategories ?? [], code);
    if (path.length) return [node, ...path];
  }
  return [];
}

function searchablePaths(nodes: ICategoryTree[], prefix: ICategoryTree[] = []): ICategoryTree[][] {
  return nodes.flatMap((node) => {
    const path = [...prefix, node];
    return [path, ...searchablePaths(node.subCategories ?? [], path)];
  });
}

const normalize = (value: string) => value.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\s]+/g, " ").trim().toLocaleLowerCase("fa");

export default function CategoryPicker({ categories, value, onChange, loading, error, onRetry }: {
  categories: ICategoryTree[];
  value: string;
  onChange: (code: string) => void;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const path = findPath(categories, value);
  const selected = path.at(-1);
  const scopePath = selected?.subCategories?.length ? path : path.slice(0, -1);
  const scope = scopePath.at(-1);
  const nodes = scope ? scope.subCategories : categories;
  const term = normalize(search);
  const results = term
    ? searchablePaths(nodes, scopePath).filter((result) => normalize(result.at(-1)!.name).includes(term))
    : nodes.map((node) => [...scopePath, node]);

  return (
    <Popover className="relative space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">دسته‌بندی</label>
      <PopoverButton id={id} className={`${inputClass} flex items-center justify-between gap-2`} onClick={() => setSearch("")}>
        <span className="truncate">{selected?.name || "همه دسته‌ها"}</span>
        <span aria-hidden="true">⌄</span>
      </PopoverButton>
      <PopoverPanel className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
        {({ close }) => (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {scope && <button type="button" className="rounded-lg px-2 py-2 text-emerald-700 hover:bg-emerald-50" onClick={() => { onChange(scopePath.at(-2)?.code || ""); setSearch(""); }}>→ بازگشت</button>}
              <button type="button" className="rounded-lg px-2 py-2 text-emerald-700 hover:bg-emerald-50" onClick={() => { onChange(""); setSearch(""); }}>همه دسته‌ها</button>
              <span className="leading-6 text-slate-500">{scopePath.map((node) => node.name).join(" / ") || "دسته‌بندی‌های اصلی"}</span>
            </div>
            <TextField label={scope ? "جستجو در زیر‌دسته‌ها" : "جستجوی دسته‌بندی"} placeholder="نام دسته‌بندی" value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className="mt-3 max-h-64 overflow-y-auto" aria-live="polite">
              {loading ? <p className="p-3 text-sm text-slate-500">در حال دریافت دسته‌بندی‌ها…</p> : error ? <button type="button" onClick={onRetry} className="p-3 text-sm text-red-600">دریافت دسته‌بندی‌ها ناموفق بود؛ تلاش دوباره</button> : results.length ? results.map((result) => {
                const node = result.at(-1)!;
                const hasChildren = !!node.subCategories?.length;
                return <button key={node.code} type="button" aria-pressed={value === node.code} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-right text-sm text-slate-700 hover:bg-emerald-50 focus-visible:outline-emerald-600" onClick={() => {
                  onChange(node.code);
                  setSearch("");
                  if (!hasChildren) close();
                }}>
                  <span><span className="block">{node.name}</span>{term && result.length > 1 && <span className="mt-1 block text-xs text-slate-400">{result.slice(0, -1).map((parent) => parent.name).join(" / ")}</span>}</span>
                  <span aria-hidden="true">{hasChildren ? "←" : value === node.code ? "✓" : ""}</span>
                </button>;
              }) : <p className="p-3 text-sm text-slate-500">دسته‌بندی‌ای پیدا نشد</p>}
            </div>
            {scope && <button type="button" className="mt-3 w-full rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800" onClick={() => { onChange(scope.code); close(); }}>نمایش همه محصولات {scope.name}</button>}
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
