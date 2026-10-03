"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BookmarkIcon, StarIcon } from "@heroicons/react/24/outline";

import { useMyFarm } from "@/hooks/queries/useFarm";
import { useProducts } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { truncateText } from "@/shared/utils/truncateText";
import useDebounce from "@/shared/hooks/useDebounce";
import AnimatedSearchInput from "@/design-system/atoms/AnimatedSearchInput";

import Map from "../dashbord/map/Map";

/* -------------------- Types -------------------- */

type FarmDetailProps = {
  farmId: string;
};

type ProductFilters = {
  farmCode: string;
  name?: string;
  minPrice?: number;
  minStock?: number;
  maxStock?: number;
};

/* -------------------- Helpers -------------------- */

function parseCoordinate(value: unknown): number {
  if (
    value == null ||
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  ) {
    return NaN;
  }

  return Number(value);
}

const TABS = ["همه", "بالاترین قیمت", "بیشترین موجودی", "کمترین موجودی"];

/* -------------------- Component -------------------- */

const FarmDetail = ({ farmId }: FarmDetailProps) => {
  const { farmDetail, farmDetailLoading } = useMyFarm(farmId);

  const [activeTab, setActiveTab] = useState("همه");
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  /* -------------------- فیلتر محصولات -------------------- */

  const productFilters = useMemo<ProductFilters>(() => {
    const baseFilter: ProductFilters = {
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

  /* -------------------- اطلاعات مزرعه -------------------- */

  const farm = farmDetail?.data;

  const { name, description, imageUrl, address } = farm || {};

  /* -------------------- مختصات مزرعه -------------------- */

  const latitude = parseCoordinate(address?.latitude);
  const longitude = parseCoordinate(address?.longitude);

  // مطابق محدوده ایران در کامپوننت Map
  const hasLocation =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 24.5 &&
    latitude <= 40 &&
    longitude >= 44 &&
    longitude <= 63.5;

  return (
    <div
      dir="rtl"
      className="mx-auto min-h-screen max-w-md border bg-white pb-24"
    >
      {/* -------------------- مشخصات مزرعه -------------------- */}

      <div className="flex items-center gap-3 p-4">
        <BookmarkIcon className="h-4 w-4 shrink-0 text-gray-500" />

        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold">
            {farmDetailLoading ? "در حال دریافت اطلاعات..." : (name ?? "")}
          </h1>

          <p className="mt-1 text-xs text-gray-400">{description ?? ""}</p>
        </div>

        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
          {imageUrl && (
            <Image
              src={getImageUrl(imageUrl)}
              alt={name || "تصویر مزرعه"}
              fill
              sizes="40px"
              className="object-cover"
            />
          )}
        </div>
      </div>

      {/* -------------------- امتیاز و جستجو -------------------- */}

      <div className="flex items-center gap-3 px-4">
        <div className="flex shrink-0 items-center gap-1 text-sm">
          <StarIcon className="h-4 w-4 text-black" />
          <span>۴.۸</span>
          <span className="text-gray-400">(۳۸۸)</span>
        </div>

        <AnimatedSearchInput value={search} onChange={setSearch} />
      </div>

      {/* -------------------- تب‌ها -------------------- */}

      <div className="mt-4 flex gap-6 overflow-x-auto border-b px-4 text-sm">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 whitespace-nowrap pb-2 ${
              activeTab === tab
                ? "border-b-2 border-black font-medium"
                : "text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* -------------------- محصولات -------------------- */}

      <div className="divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            در حال دریافت محصولات...
          </div>
        ) : products?.length ? (
          products.map((product) => (
            <div key={product.code} className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                {product.primaryImageUrl && (
                  <Image
                    src={getImageUrl(product.primaryImageUrl)}
                    alt={product.name || "تصویر محصول"}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{product.name}</h3>

                <p className="mt-1 text-xs text-gray-400">
                  {truncateText(product.description || "", 60)}
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {product.wholesalePrice} تومان
                </p>

                <button
                  type="button"
                  className="mt-2 rounded-full bg-emerald-500 px-3 py-1 text-xs text-white"
                >
                  افزودن به سبد خرید
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">
            محصولی پیدا نشد.
          </div>
        )}
      </div>

      {/* -------------------- نمایش موقعیت مزرعه -------------------- */}

      <div className="w-full space-y-3 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">
          موقعیت مزرعه روی نقشه
        </h2>

        {farmDetailLoading ? (
          <div className="flex h-[200px] items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
            در حال دریافت موقعیت مزرعه...
          </div>
        ) : hasLocation ? (
          <Map
            position={{
              lat: latitude,
              lng: longitude,
            }}
            isDetailAdvertiseView
            pickLocation={false}
            className="h-[350px]"
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
            موقعیت معتبر برای مزرعه ثبت نشده است.
          </div>
        )}
      </div>

      {/* -------------------- نوار پایین -------------------- */}

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center justify-between border-t bg-white p-4">
        <div className="flex items-center gap-3">
          <button type="button" className="h-8 w-8 rounded-full bg-gray-100">
            -
          </button>

          <span>۱</span>

          <button type="button" className="h-8 w-8 rounded-full bg-gray-100">
            +
          </button>
        </div>

        <span className="font-semibold">۹۰٬۰۰۰ تومان</span>
      </div>
    </div>
  );
};

export default FarmDetail;
