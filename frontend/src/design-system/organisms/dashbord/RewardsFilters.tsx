"use client";
import { DiscountCard } from "@/design-system/molecules/dashbord/DiscountCard";
import { useRewards } from "@/hooks/queries/useRewards";
import { ICategoryFeatured } from "@/shared/types/categories";
import { useMemo, useState } from "react";
import { GiFlowerPot } from "react-icons/gi";
import { IoPricetagOutline } from "react-icons/io5";
import {
  allRewardColors,
  rewardCategoryColor,
  rewardColors,
} from "@/shared/utils/rewardColors";

const RewardsFilters = ({
  categories,
}: {
  categories: ICategoryFeatured[];
}) => {
  const { data } = useRewards();
  const [active, setActive] = useState<string>("all");
  const filteredRewards = useMemo(() => {
    const rewards = data?.data ?? [];
    if (active === "all") return rewards;
    return rewards.filter((item) =>
      item.rootCategoryCodes
        ?.split(",")
        .map((code) => code.trim())
        .includes(active),
    );
  }, [active, data]);

  return (
    <>
      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-x-4 border-b-2 border-b-secondary-400 text-secondary-600 py-4 px-2">
          <IoPricetagOutline className="w-6 h-6" />
          <span> تخفیف و جایزه شما</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ code: "all", name: "همه" }, ...categories].map((category) => (
            <button
              key={category.code}
              type="button"
              aria-pressed={active === category.code}
              onClick={() => setActive(category.code)}
              className={`min-h-11 rounded-full border bg-white px-4 py-2 text-sm transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${active === category.code ? "border-slate-900 font-bold text-slate-900" : "border-slate-200 text-slate-500"}`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredRewards.map((dis) => {
            const end = new Date(dis.endDate);
            const now = new Date();
            const daysLeft = Math.ceil(
              (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            const remainingUsage = dis.maxUsage - dis.usageCount;
            const codes = (dis.rootCategoryCodes ?? "")
              .split(",")
              .map((code) => code.trim())
              .filter(Boolean);
            const categoryNames = codes
              .map(
                (code) =>
                  categories.find((category) => category.code === code)?.name,
              )
              .filter((name): name is string => !!name);
            const names = categoryNames.length
              ? categoryNames
              : (dis.rootCategoryNames ?? "")
                  .split("،")
                  .map((name) => name.trim())
                  .filter(Boolean);
            const palette =
              names.length === 1
                ? rewardCategoryColor(names[0])
                : rewardColors.all;
            const colors = names.length
              ? [
                  ...new Set(
                    names.map((name) => rewardCategoryColor(name).color),
                  ),
                ]
              : allRewardColors;
            return (
              <DiscountCard
                key={dis.code}
                title={dis.description}
                daysLeft={daysLeft}
                remainingUsage={remainingUsage}
                code={dis.code}
                icon={<GiFlowerPot className="text-xl" />}
                palette={palette}
                colors={colors}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};

export default RewardsFilters;
