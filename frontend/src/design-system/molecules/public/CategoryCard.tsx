"use client";

import type { FC } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCategories } from "@/lib/store/slices/productFilterSlice";
import { getImageUrl } from "@/shared/utils/getImageUrl";

interface CategoryCardProps {
  category: {
    code: string;
    name: string;
    imageUrl?: string;
  };
}

const CategoryCard: FC<CategoryCardProps> = ({ category }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleClick = () => {
    dispatch(setCategories(category.code));
    router.push("/product");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group w-full overflow-hidden rounded-2xl border border-slate-100 bg-white text-right shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100">
        <Image
          src={getImageUrl(category.imageUrl)}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-3">
        <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-700 group-hover:text-emerald-800 sm:text-sm">
          {category.name}
        </p>
        <span aria-hidden="true" className="shrink-0 text-emerald-700">
          ←
        </span>
      </div>
    </button>
  );
};

export default CategoryCard;
