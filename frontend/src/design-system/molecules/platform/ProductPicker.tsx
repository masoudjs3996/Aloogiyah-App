"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "@/lib/actions/platform";
import useDebounce from "@/shared/hooks/useDebounce";
import { TextField, SelectField } from "./FormField";
import QueryState from "./QueryState";
export default function ProductPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [search, setSearch] = useState("");
  const term = useDebounce(search, 350);
  const query = useQuery({
    queryKey: ["platform", "product-options", term],
    queryFn: ({ signal }) =>
      platformApi.products(
        { Name: term || undefined, PageNumber: 1, PageSize: 50 },
        signal,
      ),
  });
  return (
    <div className="space-y-3">
      <TextField
        label="جست‌وجوی محصول"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="نام محصول را بنویسید"
      />
      <QueryState error={query.error} retry={() => query.refetch()}>
        <SelectField
          label="محصول"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={query.isLoading}
        >
          <option value="">
            {query.isLoading ? "در حال دریافت…" : "انتخاب محصول"}
          </option>
          {value && !query.data?.items.some((p) => p.code === value) && (
            <option value={value}>محصول انتخاب‌شده ({value})</option>
          )}
          {query.data?.items.map((product) => (
            <option key={product.code} value={product.code}>
              {product.name}
            </option>
          ))}
        </SelectField>
      </QueryState>
      <p className="text-xs text-slate-400">
        برای پیدا کردن محصول، نام دقیق‌تر وارد کنید.
      </p>
    </div>
  );
}
