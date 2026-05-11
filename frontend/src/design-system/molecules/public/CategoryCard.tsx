"use client";

import {
  setCategories,
  setSearch,
} from "@/lib/store/slices/productFilterSlice";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

interface CategoryCardProps {
  category: any;
}

const CategoryCard: FC<CategoryCardProps> = ({ category }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const handlerClick = (code: string) => {
    dispatch(setCategories(code));
    router.push("/product");
  };

  return (
<<<<<<< HEAD
    <div className="group relative w-28 m-2 bg-white rounded-md shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer">
=======
    <div
      className="group relative bg-white rounded-md shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
      onClick={() => handlerClick(category?.code)}
    >
>>>>>>> 35a56bf7508fb1ac82778fe55f43c6436f5ae3e7
      <div className="relative w-full h-20 overflow-hidden bg-gray-50">
        <Image
          src={getImageUrl(category?.imageUrl)}
          alt={"categoryImage"}
          fill
          className="absolute object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-1 flex items-center gap-2 bg-secondary-300">
<<<<<<< HEAD
        <p className="text-sm font-medium text-gray-800 mx-auto truncate">{name}</p>
=======
        <p className="text-sm font-medium text-gray-800 truncate">
          {category?.name}
        </p>
>>>>>>> 35a56bf7508fb1ac82778fe55f43c6436f5ae3e7
      </div>
      <div className="absolute rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default CategoryCard;

// "use client";
// import { getImageUrl } from "@/shared/utils/getImageUrl";
// import Image from "next/image";
// import { FC } from "react";

// interface CategoryCardProps {
//   name: string;
//   imageUrl: string;
// }

// const CategoryCard: FC<CategoryCardProps> = ({ name, imageUrl }) => {
//   const handlerClick = ()=>{

//   }
//   return (
//     <div
//       className="group relative bg-white rounded-md shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
//       onClick={() => handlerClick()}
//     >
//       <div className="relative w-full h-20 overflow-hidden bg-gray-50">
//         <Image
//           src={getImageUrl(imageUrl)}
//           alt={"categoryImage"}
//           fill
//           className="absolute object-cover group-hover:scale-110 transition-transform duration-300"
//         />
//         <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//       </div>
//       <div className="p-1 flex items-center gap-2 bg-secondary-300">
//         <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
//       </div>
//       <div className="absolute inset-0 ring-2 ring-indigo-500 ring-inset rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
//     </div>
//   );
// };

// export default CategoryCard;
