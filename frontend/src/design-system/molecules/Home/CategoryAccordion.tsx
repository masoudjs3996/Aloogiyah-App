"use client";

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { ICategoryTree } from "@/shared/types/categories";
import { LastItem } from "@/design-system/atoms/LastItem";

interface Props {
  category: ICategoryTree;
}

export const CategoryAccordion = ({ category }: Props) => {
  const [open, setOpen] = useState(false);

  const hasChildren = category.subCategories?.length > 0;

  return (
    <li className="border-b py-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => hasChildren && setOpen(!open)}
      >
        <span className="text-secondary-900 font-bold text-xs">
          {category.name}
        </span>

        {hasChildren && (
          <FaChevronDown
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {open && (
        <ul className="p-10 grid grid-cols-3 gap-10">
          {category.subCategories?.map((sub) => (
            <LastItem key={sub.code} category={sub} />
          ))}
        </ul>
      )}
    </li>
  );
};
