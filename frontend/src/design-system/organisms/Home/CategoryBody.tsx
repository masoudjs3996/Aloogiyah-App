"use client";

import { useState } from "react";
import { ICategoryTree } from "@/shared/types/categories";
import { CategoryAccordion } from "@/design-system/molecules/Home/CategoryAccordion";

interface Props {
  categories: ICategoryTree[];
}

export const CategoryBody = ({ categories }: Props) => {
  const [activeIndex, setActiveIndex] = useState(
    categories.findIndex((c) => c.subCategories?.length > 0) ?? 0
  );

  const category = categories[activeIndex];

  return (
    <ul className="w-full pr-5">
      {category.subCategories?.map((cat) => (
        <CategoryAccordion key={cat.code} category={cat} />
      ))}
    </ul>
  );
};
