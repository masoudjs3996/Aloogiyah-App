"use client";


import { ICategoryTree } from "@/shared/types/categories";
import { CategoryAccordion } from "@/design-system/molecules/Home/CategoryAccordion";

interface Props {
  categories: ICategoryTree[];
}

export const CategoryBody = ({ categories }: Props) => {

  return (
    <ul className="w-full pr-5 ">
      {categories?.map((cat) => (
        <CategoryAccordion key={cat.code} category={cat} />
      ))}
    </ul>
  );
};
