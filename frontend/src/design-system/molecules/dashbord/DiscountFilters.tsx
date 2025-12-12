"use client";


import { TagFilter } from "@/design-system/atoms/TagFilter";
import { useState } from "react";

const filters = ["همه", "گل و گیاه آپارتمانی", "گل و باکس هدیه"];

export const DiscountFilters = () => {
  const [active, setActive] = useState("همه");
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 ">
      {filters.map((item) => (
        <TagFilter
          key={item}
          label={item}
          active={active === item}
          onClick={() => setActive(item)}
        />
      ))}
    </div>
  );
};
