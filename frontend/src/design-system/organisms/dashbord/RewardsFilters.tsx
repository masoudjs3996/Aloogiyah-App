"use client";
import { TagFilter } from "@/design-system/atoms/TagFilter";
import { DiscountCard } from "@/design-system/molecules/dashbord/DiscountCard";
import { DiscountFilters } from "@/design-system/molecules/dashbord/DiscountFilters";
import { useRewards } from "@/hooks/queries/useRewards";
import { ICategoryFeatured } from "@/shared/types/categories";
import { useMemo, useState } from "react";
import { GiFlowerPot } from "react-icons/gi";
import { IoPricetagOutline } from "react-icons/io5";

const RewardsFilters = ({
  categories,
}: {
  categories: ICategoryFeatured[];
}) => {

  const { data } = useRewards();
  const [active, setActive] = useState<string>("all");
  const filteredRewards = useMemo(() => {
    if (!categories) return [];
    if (active === "all") return data?.data;
    return data?.data?.filter((item) => item.rootCategoryCodes === active);
  }, [active, data]);


  return (
    <>
      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-x-4 border-b-2 border-b-secondary-400 text-secondary-600 py-4 px-2">
          <IoPricetagOutline className="w-6 h-6" />
          <span> تخفیف و جایزه شما</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TagFilter
            label="همه"
            active={active === "all"}
            onClick={() => setActive("all")}
          />

          {categories.map((cat) => (
            <TagFilter
              key={cat.code}
              label={cat.name}
              active={active === cat.code}
              onClick={() => setActive(cat.code)}
            />
          ))}
        </div>

        <div className="space-y-4">
          {filteredRewards?.map((dis) => {
            const end = new Date(dis.endDate);
            const now = new Date();
            const daysLeft = Math.ceil(
              (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            const remainingUsage = dis.maxUsage - dis.usageCount;
            return (
              <>
                <DiscountCard
                  key={dis.code}
                  title={dis.description}
                  daysLeft={daysLeft}
                  remainingUsage={remainingUsage}
                  code={dis.code}
                  icon={<GiFlowerPot className="text-xl" />}
                  bg="bg-pink-100 text-pink-700"
                />
              </>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default RewardsFilters;
