"use client";

import Button from "@/design-system/atoms/Button";
import { useProduct } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import {
  ArrowRightIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

type Review = {
  id: number;
  name: string;
  date: string;
  text: string;
  isStoreReply?: boolean;
};

const reviews: Review[] = [
  {
    id: 1,
    name: "علی حسینی",
    date: "۲ روز پیش",
    text: "محصول تازه و با کیفیت بود، بسته‌بندی هم عالی 👍",
  },
  {
    id: 2,
    name: "فروشگاه",
    date: "۱ روز پیش",
    text: "ممنون از خریدتون 🌱 خوشحالیم راضی بودید",
    isStoreReply: true,
  },
  {
    id: 3,
    name: "فاطمه کریمی",
    date: "۵ روز پیش",
    text: "طعمش خوب بود ولی یکم کوچیک‌تر از انتظارم بود",
  },
];

const ProductDetail = ({ productId }: { productId: string }) => {
  const { product, isLoading } = useProduct(productId);
  const { name, retailPrice, wholesalePrice, description, primaryImageUrl } =
    product.data ?? {};
  return (
    <div className="mx-auto max-w-md min-h-screen bg-white">
      <div className="p-4 flex items-center justify-between">
        <ArrowRightIcon className="w-4 h-4" />
      </div>
      <div className="px-4 ">
        <div className="relative w-full h-72 bg-gray-500 rounded-2xl">
          <Image
            alt={name}
            src={getImageUrl(primaryImageUrl) ?? ""}
            fill
            className="absolute object-cover"
          />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-2 h-2 bg-white rounded-full opacity-100" />
            <span className="w-2 h-2 bg-white rounded-full opacity-50" />
            <span className="w-2 h-2 bg-white rounded-full opacity-50" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm">
          <StarIcon className="w-4 h-4" />
          <span>۴.۸</span>
          <span className="text-gray-400">(۳۸۸)</span>
        </div>

        <h1 className="mt-2 text-base font-semibold">{name}</h1>

        <p className="mt-1 text-xs text-gray-400">{description}</p>

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">۵۰۰ گرم</span>
            <span className="font-semibold">{retailPrice}تومان</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">۱ کیلوگرم</span>
            <span className="font-semibold">{wholesalePrice}تومان</span>
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div className="px-4 flex items-center gap-3">
        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <MinusIcon className="w-4 h-4" />
        </button>
        <span>۱</span>
        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Reviews */}
      <div className="p-4 mt-6">
        <h2 className="font-medium text-sm mb-4">نظرات دیگر کاربران</h2>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed ${
                review.isStoreReply
                  ? "bg-emerald-50 mr-auto border border-emerald-200"
                  : "bg-gray-100 ml-auto"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{review.name}</span>
                <span className="text-[10px] text-gray-400">{review.date}</span>
              </div>
              <p>{review.text}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Add to Cart */}
      <Button variant="secondary">افزودن به سبد خرید</Button>
    </div>
  );
};

export default ProductDetail;
