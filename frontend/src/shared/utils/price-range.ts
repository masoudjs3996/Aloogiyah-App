import { priceValue } from "./product-filters";

export function formatPriceInput(value: string): string {
  const normalized = value
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[,٬]/g, "")
    .replace(/٫/g, ".");
  if (!/^\d*(\.\d{0,2})?$/.test(normalized)) return normalized;
  const [whole, fraction] = normalized.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : grouped + "." + fraction;
}

export function catalogPrice(product?: {
  retailPrice: number;
  wholesalePrice?: number | null;
  discountedRetailPrice?: number | null;
  discountedWholesalePrice?: number | null;
}): number | undefined {
  if (!product) return undefined;
  const value = Number(
    product.discountedWholesalePrice ??
      product.wholesalePrice ??
      product.discountedRetailPrice ??
      product.retailPrice,
  );
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function priceRange(
  minPrice: string,
  maxPrice: string,
  catalogMaximum?: number,
) {
  const min = priceValue(minPrice);
  const max = priceValue(maxPrice);
  const validMin = min !== undefined && Number.isFinite(min) ? min : 0;
  const validMax = max !== undefined && Number.isFinite(max) ? max : undefined;
  const base = Math.max(
    catalogMaximum !== undefined && catalogMaximum > 0
      ? catalogMaximum
      : 1_000_000,
    validMin,
    validMax ?? 0,
  );
  const step = Math.max(1, 10 ** (Math.floor(Math.log10(base)) - 2));
  const ceiling = Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.ceil(base / step) * step,
  );
  const upper = Math.min(ceiling, validMax ?? ceiling);
  const lower = Math.min(upper, validMin);
  return { lower, upper, ceiling, step };
}

export function movePriceThumb(
  value: number,
  thumb: "min" | "max",
  range: ReturnType<typeof priceRange>,
) {
  const rounded = Math.round(value / range.step) * range.step;
  return thumb === "min"
    ? Math.max(0, Math.min(range.upper, rounded))
    : Math.min(range.ceiling, Math.max(range.lower, rounded));
}
