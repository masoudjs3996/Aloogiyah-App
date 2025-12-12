"use client";
import { TagFilter } from "@/design-system/atoms/TagFilter";
import { DiscountCard } from "@/design-system/molecules/dashbord/DiscountCard";
import { DiscountFilters } from "@/design-system/molecules/dashbord/DiscountFilters";
import { useRewards } from "@/hooks/queries/useRewards";
import { useMemo, useState } from "react";
import { GiFlowerPot } from "react-icons/gi";
import { IoPricetagOutline } from "react-icons/io5";

const RewardsFilters = ({ categories }: { categories: any }) => {
  const { data } = useRewards();
  const [active, setActive] = useState<string>("all");
  const filteredRewards = useMemo(() => {
    if (!data?.data) return [];
    if (active === "all") return data.data;
    //  return data?.data?.filter((item) => item.categoryCodes === active);
  }, [active, data]);
  console.log(data);
  return (
    <>
      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-x-4 border-b-2 border-b-secondary-400 text-secondary-600 py-4 px-2">
          <IoPricetagOutline className="w-6 h-6" />
          <span> تخفیف و جایزه شما</span>
        </div>
        {/* <TagFilter
          key={item}
          label={item}
          active={active === item}
          onClick={() => setActive(item)}
        /> */}
        <div className="space-y-4">
          {data?.data?.map((dis) => {
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
