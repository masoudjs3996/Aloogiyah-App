"use client";

import { ICategoryTree } from "@/shared/types/categories";
import { CategoryBody } from "./CategoryBody";
import { CategorySidebar } from "./CategorySidebar";
import { useEffect, useState } from "react";
interface Props {
  categories: ICategoryTree[];
}
const Categories = ({ categories }: Props) => {
  const [activeCat, setActiveCat] = useState<ICategoryTree[]>([]);

  return (
    <div className="flex w-full">
      <CategorySidebar categories={categories} setActiveCat={setActiveCat} />
      <CategoryBody categories={activeCat} />
    </div>
  );
};

export default Categories;
