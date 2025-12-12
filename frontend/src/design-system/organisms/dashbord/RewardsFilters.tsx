"use client";
import { TagFilter } from "@/design-system/atoms/TagFilter";
import { DiscountCard } from "@/design-system/molecules/dashbord/DiscountCard";
import { DiscountFilters } from "@/design-system/molecules/dashbord/DiscountFilters";
import { useRewards } from "@/hooks/queries/useRewards";
import { useState } from "react";
import { GiFlowerPot } from "react-icons/gi";
import { IoPricetagOutline } from "react-icons/io5";
import { LuLeaf, LuTreePine } from "react-icons/lu";

const RewardsFilters = ({ categories }: { categories: any }) => {
  const { data } = useRewards();
  const [active, setActive] = useState("همه");
  console.log(categories)
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
            return (
              <>
                <DiscountCard
                  key={dis.code}
                  title={dis.description}
                  category={categories}
                  code={dis.code}
                  icon={<GiFlowerPot className="text-xl" />}
                  bg="bg-pink-100 text-pink-700"
                />
              </>
            );
          })}
          <DiscountCard
            title="۹۰ هزار تومان تخفیف اولین سفارش"
            category={categories}
            code="ERGO145-JUIKPHG"
            icon={<GiFlowerPot className="text-xl" />}
            bg="bg-pink-100 text-pink-700"
          />

          <DiscountCard
            title="۱۲۰ هزار تومان تخفیف اولین سفارش"
            category={categories}
            code="ERGO145-JUIKPHG"
            icon={<LuTreePine className="text-xl" />}
            bg="bg-yellow-100 text-yellow-700"
          />

          <DiscountCard
            title="۱۲۰ هزار تومان تخفیف برای دسته گل"
            category={categories}
            code="ERGO145-JUIKPHG"
            icon={<LuLeaf className="text-xl" />}
            bg="bg-green-100 text-green-700"
          />
        </div>
      </div>
    </>
  );
};

export default RewardsFilters;
