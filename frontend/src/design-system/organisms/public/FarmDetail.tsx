"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { BookmarkIcon, StarIcon } from "@heroicons/react/24/outline";
import { BiSearch } from "react-icons/bi";
import { useMyFarm } from "@/hooks/queries/useFarm";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { useProducts } from "@/hooks/queries/useProduct";
import { truncateText } from "@/shared/utils/truncateText";
import SearchInput from "@/design-system/atoms/SearchInput";
import useDebounce from "@/shared/hooks/useDebounce";
import AnimatedSearchInput from "@/design-system/atoms/AnimatedSearchInput";
type Product = {
  id: number;
  name: string;
  weight: string;
  price: number;
  image?: string;
};
const TABS = ["همه", "بالاترین قیمت", "بیشترین موجودی", "کمترین موجودی"];
const FarmDetail = ({ farmId }: { farmId: string }) => {
  const { farmDetail, farmDetailLoading } = useMyFarm(farmId);
  const [activeTab, setActiveTab] = useState("همه");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [openSearch, setOpenSearch] = useState(false);
  const productFilters = useMemo(() => {
    const baseFilter: any = {
      farmCode: farmId,
      ...(debouncedSearch && { name: debouncedSearch }),
    };

    if (activeTab === "بالاترین قیمت") {
      return {
        ...baseFilter,
        minPrice: 1,
      };
    }

    if (activeTab === "بیشترین موجودی") {
      return {
        ...baseFilter,
        minStock: 1,
      };
    }

    if (activeTab === "کمترین موجودی") {
      return {
        ...baseFilter,
        maxStock: 1,
      };
    }

    return baseFilter;
  }, [activeTab, farmId, debouncedSearch]);

  const { products, isLoading } = useProducts(productFilters);

  const FarmDetail = farmDetail?.data;
  const { name, description, capacity, minPurchase, imageUrl, address } =
    FarmDetail || {};

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
        <div className="flex items-center gap-1 text-sm ">
          <StarIcon className="text-black w-4 h-4" />
          <span>۴.۸</span>
          <span className="text-gray-400">(۳۸۸)</span>
        </div>
        <AnimatedSearchInput value={search} onChange={setSearch} />
      </div>
      <div className="flex px-4 mt-4 gap-6 text-sm border-b">
        {TABS?.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 ${
              activeTab === tab
                ? "border-b-2 border-black font-medium"
                : "text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="divide-y">
        {products?.map((product) => (
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
