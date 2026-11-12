import { persianDate } from "./persian-date";
import { MEDIA_BASE } from "../../api/config";
import type { ProductSummary } from "../types/mobile";
export const number = (n: number | string = 0) =>
  new Intl.NumberFormat("fa-IR").format(Number(n) || 0);
export const money = (n: number = 0) => `${number(n)} تومان`;
export const date = (s?: string) =>
  persianDate(s);
export function imageUrl(url?: string | null): string | undefined {
  if (!url) return;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z]:\\/i.test(url)) return;
  return `${MEDIA_BASE}/${url.replace(/^\/+/, "")}`;
}
export const activeOffer = (p: ProductSummary) =>
  !!p.discountPercentage &&
  (!p.discountEndsAt || Date.parse(p.discountEndsAt) > Date.now());
export const price = (p: ProductSummary) =>
  p.wholesalePrice != null
    ? activeOffer(p)
      ? (p.discountedWholesalePrice ?? p.wholesalePrice)
      : p.wholesalePrice
    : activeOffer(p)
      ? (p.discountedRetailPrice ?? p.retailPrice)
      : p.retailPrice;
export const digits = (v: string) =>
  v
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
export const quantity = (v: string) => Number(digits(v));
