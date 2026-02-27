import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import { FC } from "react";

interface CategoryCardProps {
  name: string;
  imageUrl: string;
}

const CategoryCard: FC<CategoryCardProps> = ({ name, imageUrl }) => {
  return (
    <div className="group relative bg-white rounded-md shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer">
      <div className="relative w-full h-20 overflow-hidden bg-gray-50">
        <Image
          src={getImageUrl(imageUrl)}
          alt={"categoryImage"}
          fill
          className="absolute object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-1 flex items-center gap-2 bg-secondary-300">
        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
      </div>
      <div className="absolute inset-0 ring-2 ring-indigo-500 ring-inset rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default CategoryCard;