"use client";

import { useCommercePricing } from "@/hooks/queries/useCommercePricing";
import { money } from "@/shared/utils/platform";

export default function ProductPrice({
  retailPrice,
  wholesalePrice,
  compact = false,
}: {
  retailPrice?: number | string | null;
  wholesalePrice?: number | string | null;
  compact?: boolean;
}) {
  const { wholesale, showBoth } = useCommercePricing();
  const retail = retailPrice == null ? undefined : Number(retailPrice);
  const partner = wholesalePrice == null ? undefined : Number(wholesalePrice);
  const main = wholesale && partner != null ? partner : retail;

  return (
    <div className={compact ? "space-y-0.5" : "space-y-1.5"}>
      <p className="font-bold text-emerald-800">{money(main)}</p>
      {showBoth && partner != null && retail != null && (
        <p className="text-xs font-medium text-slate-500">
          {wholesale ? "همکاری" : "قیمت همکاری"}: {money(partner)}
          <span className="mx-1">·</span>
          {wholesale ? "معمولی" : "قیمت معمولی"}: {money(retail)}
        </p>
      )}
      {wholesale && !showBoth && partner != null && (
        <p className="text-xs text-slate-500">قیمت همکاری</p>
      )}
    </div>
  );
}
