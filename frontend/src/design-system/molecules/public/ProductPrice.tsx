"use client";
import { saleUnitLabel } from "@/shared/utils/sale-units";

import { useCommercePricing } from "@/hooks/queries/useCommercePricing";
import { faNumber, money } from "@/shared/utils/platform";
import type { ProductOffer } from "@/shared/types/productOffer";
import useProductOffer from "@/shared/hooks/useProductOffer";

export default function ProductPrice({
  saleUnit,
  retailPrice,
  wholesalePrice,
  compact = false,
  offer = {},
  stockLabel,
}: {
  saleUnit?: string | null;
  retailPrice?: number | string | null;
  wholesalePrice?: number | string | null;
  compact?: boolean;
  offer?: ProductOffer;
  stockLabel?: string;
}) {
  const { wholesale, showBoth } = useCommercePricing();
  const retail = retailPrice == null ? undefined : Number(retailPrice);
  const partner = wholesalePrice == null ? undefined : Number(wholesalePrice);
  const main = wholesale && partner != null ? partner : retail;
  const active = useProductOffer(offer);
  const percentage = active ? Number(offer.discountPercentage) : 0;
  const apply = (price: number | undefined, discounted?: number | null) =>
    price == null ? undefined : active && discounted != null ? Number(discounted) : Math.round(price * (1 - percentage / 100) * 100) / 100;
  const secondaryPrice = (price?: number) =>
    compact && price != null ? faNumber(price) : money(price);
  const hasBothPrices = showBoth && partner != null && retail != null;

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1.5"}>
      {(saleUnit !== undefined || offer.saleUnit !== undefined) && <p className="text-xs text-slate-500">قیمت برای هر {saleUnitLabel(saleUnit ?? offer.saleUnit)}</p>}
      {active && <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-red-500 px-2 py-1 font-bold text-white">{percentage.toLocaleString("fa-IR")}٪ تخفیف</span>
        <del className="text-slate-400">{money(main)}</del>
      </div>}
      <p className="font-bold text-emerald-800">{money(apply(main, wholesale && partner != null ? offer.discountedWholesalePrice : offer.discountedRetailPrice))}</p>
      {active && <p className="text-[11px] font-normal leading-5 text-slate-500">تا {new Date(offer.discountEndsAt!).toLocaleString("fa-IR-u-ca-persian", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" })}</p>}
      {hasBothPrices && (
        <div className="flex flex-wrap gap-x-2 text-xs font-medium text-slate-500">
          <span className="whitespace-nowrap">
            عمده‌فروشی: {secondaryPrice(apply(partner, offer.discountedWholesalePrice))}
          </span>
          <span className="whitespace-nowrap">
            خرده‌فروشی: {secondaryPrice(apply(retail, offer.discountedRetailPrice))}
          </span>
        </div>
      )}
      {wholesale && !showBoth && partner != null && (
        <p className="text-xs text-slate-500">قیمت همکاری</p>
      )}
      {stockLabel && <p className="pt-1 text-left text-[11px] text-slate-400">{stockLabel}</p>}
    </div>
  );
}
