"use client";
import React from "react";
import Image from "next/image";
import { BookmarkIcon, StarIcon } from "@heroicons/react/24/outline";
import { BiSearch } from "react-icons/bi";
import { useMyFarm } from "@/hooks/queries/useFarm";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { useProducts } from "@/hooks/queries/useProduct";
import { truncateText } from "@/shared/utils/truncateText";
type Product = {
  id: number;
  name: string;
  weight: string;
  price: number;
  image?: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "نارگیل",
    weight: "۷۰۰ گرم",
    price: 56000,
    image: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Coconut.jpg",
  },
  {
    id: 2,
    name: "توت فرنگی",
    weight: "۵۰۰ گرم",
    price: 45000,
  },
];

const FarmDetail = ({ farmId }: { farmId: string }) => {
  const { farmDetail, farmDetailLoading } = useMyFarm(farmId);
  const { products, isLoading } = useProducts(farmId);
  const FarmDetail = farmDetail?.data;
  const { name, description, capacity, minPurchase, imageUrl, address } =
    FarmDetail || {};
  console.log(products);

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen border">
      <div className="p-4 flex items-center gap-3 ">
        <BookmarkIcon className="text-gray-500 w-4 h-4" />
        <div className="flex-1">
          <h1 className="font-semibold text-sm">{name ?? ""} </h1>
          <p className="text-xs text-gray-400">{description ?? ""}</p>
        </div>
        <div className="relative w-10 h-10 ">
          {imageUrl ? (
            <Image
              src={getImageUrl(imageUrl)}
              alt={name ?? ""}
              fill
              className="object-cover absolute"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200" />
          )}
        </div>
      </div>
      <div className="px-4 flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm">
          <StarIcon className="text-black w-4 h-4" />
          <span>۴.۸</span>
          <span className="text-gray-400">(۳۸۸)</span>
        </div>
        <div className="ml-auto">
          <BiSearch className="text-gray-500" />
        </div>
      </div>
      <div className="flex px-4 mt-4 gap-6 text-sm border-b">
        {["میوه فصل", "میوه خاص", "صیفی جات", "سبزیجات"].map((tab, i) => (
          <button
            key={i}
            className={`pb-2 ${
              tab === "میوه فصل"
                ? "border-b-2 border-black font-medium"
                : "text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="divide-y">
        {products.map((product) => (
          <div key={product.code} className="flex p-4 gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden relative">
              {product.name && (
                <Image
                  src={getImageUrl(product?.primaryImageUrl)}
                  alt={product.name}
                  fill
                  className="object-cover absolute"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{product.name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {truncateText(product.description, 60)}
              </p>
              <p className="text-sm font-semibold mt-2">
                {product.wholesalePrice} تومان
              </p>

              <button className="mt-2 text-xs bg-emerald-500 text-white px-3 py-1 rounded-full">
                افزودن به سبد خرید
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Quantity Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-gray-100">-</button>
          <span>۱</span>
          <button className="w-8 h-8 rounded-full bg-gray-100">+</button>
        </div>
        <span className="font-semibold">۹۰٬۰۰۰ تومان</span>
      </div>
    </div>
  );
};

export default FarmDetail;
