"use client";
import { useQuery } from "@tanstack/react-query";
import { paged } from "@/lib/actions/platform";
import type { StoreProduct } from "@/shared/types/platform";
import {
  catalogPrice,
  formatPriceInput,
  movePriceThumb,
  priceRange,
} from "@/shared/utils/price-range";
import { TextField } from "./FormField";
import styles from "./PriceRangeField.module.css";

export default function PriceRangeField({
  minPrice,
  maxPrice,
  onChange,
}: {
  minPrice: string;
  maxPrice: string;
  onChange: (value: { minPrice: string; maxPrice: string }) => void;
}) {
  const maximum = useQuery({
    queryKey: ["platform", "price-range-maximum"],
    queryFn: ({ signal }) =>
      paged<StoreProduct>(
        "/AgriculturalListing/GetByFilter",
        {
          SortColumn: "price",
          SortDescending: true,
          PageSize: 1,
          PageNumber: 1,
        },
        false,
        signal,
      ),
    staleTime: 300000,
    retry: false,
  });
  const range = priceRange(
    minPrice,
    maxPrice,
    catalogPrice(maximum.data?.items[0]),
  );
  const update = (thumb: "min" | "max", value: number) => {
    const next = movePriceThumb(value, thumb, range);
    onChange(
      thumb === "min"
        ? { minPrice: formatPriceInput(String(next)), maxPrice }
        : {
            minPrice,
          maxPrice: formatPriceInput(String(next)),
          },
    );
  };
  const edit = (input: HTMLInputElement, thumb: "min" | "max") => {
    const beforeCursor = input.value
      .slice(0, input.selectionStart ?? input.value.length)
      .replace(/[,٬]/g, "").length;
    const formatted = formatPriceInput(input.value);
    onChange(
      thumb === "min"
        ? { minPrice: formatted, maxPrice }
        : { minPrice, maxPrice: formatted },
    );
    let cursor = 0,
      digits = 0;
    while (cursor < formatted.length && digits < beforeCursor) {
      if (formatted[cursor] !== ",") digits++;
      cursor++;
    }
    requestAnimationFrame(() => {
      if (document.activeElement === input)
        input.setSelectionRange(cursor, cursor);
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="از قیمت"
          inputMode="decimal"
          dir="ltr"
          value={formatPriceInput(minPrice)}
          placeholder="بدون حداقل"
          onChange={(event) => edit(event.currentTarget, "min")}
        />
        <TextField
          label="تا قیمت"
          inputMode="decimal"
          dir="ltr"
          value={formatPriceInput(maxPrice)}
          placeholder="بدون حداکثر"
          onChange={(event) => edit(event.currentTarget, "max")}
        />
      </div>
      <div className="mt-3 px-3" dir="rtl">
        <div className={styles.range}>
          <div className={styles.track} aria-hidden="true" />
          <div
            className={styles.selection}
            style={{
              left: `calc(${100 - (range.upper / range.ceiling) * 100}% + ${12 - 24 * (1 - range.upper / range.ceiling)}px)`,
              right: `calc(${(range.lower / range.ceiling) * 100}% + ${12 - (24 * range.lower) / range.ceiling}px)`,
            }}
            aria-hidden="true"
          />
          <input
            type="range"
            min={0}
            max={range.ceiling}
            step="any"
            value={range.lower}
            aria-label="حداقل قیمت"
            aria-valuetext={`${formatPriceInput(String(range.lower))} تومان`}
            onChange={(event) => update("min", Number(event.target.value))}
            className={styles.thumb}
            style={{ zIndex: range.lower === range.ceiling ? 4 : 2 }}
          />
          <input
            type="range"
            min={0}
            max={range.ceiling}
            step="any"
            value={range.upper}
            aria-label="حداکثر قیمت"
            aria-valuetext={
              maxPrice
                ? `${formatPriceInput(String(range.upper))} تومان`
                : "بدون حداکثر"
            }
            onChange={(event) => update("max", Number(event.target.value))}
            className={styles.thumb}
            style={{ zIndex: 3 }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>0</span>
          <span>{formatPriceInput(String(range.ceiling))}</span>
        </div>
      </div>
    </div>
  );
}
