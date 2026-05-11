"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { ICategoryTree } from "@/shared/types/categories";
import { CategoryIcon } from "@/design-system/atoms/CategoryIcon";

interface Props {
  categories: ICategoryTree[];
  setActiveCat: Dispatch<SetStateAction<ICategoryTree[]>>;
}

export const CategorySidebar = ({ categories, setActiveCat }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="flex flex-col items-start border-l w-36 ">
      {categories.map((cat, index) => (
        <div
          key={cat.code}
          className={`w-full p-3 flex items-center justify-center border-t ${
            activeIndex === index ? "bg-secondary-0" : "bg-secondary-200"
          }`}
        >
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => {
              setActiveIndex(index);
              setActiveCat(cat?.subCategories);
            }}
          >
            <CategoryIcon icon={cat?.icon} />
            <span
              className={`text-[10px] font-bold mt-2 ${
                activeIndex === index ? "text-error" : "text-secondary-600"
              }`}
            >
              {cat.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
