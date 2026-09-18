"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { getImageUrl } from "@/shared/utils/getImageUrl";

type SimilarProduct = {
  code: string;
  name: string;
  productImageUrl?: string | null;
  wholesalePrice: number | string;
  retailPrice: number | string;
};

type SimilarProductsProps = {
  products?: SimilarProduct[];
  onAddToCart?: (productCode: string) => void;
};

const INITIAL_PRODUCTS_COUNT = 4;
const MAX_PRODUCTS_COUNT = 12;

const formatPrice = (price: number | string) => {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return price;
  }

  return new Intl.NumberFormat("fa-IR").format(numericPrice);
};

export default function SimilarProducts({
  products = [],
  onAddToCart,
}: SimilarProductsProps) {
  const [showAll, setShowAll] = useState(false);

  if (products.length === 0) {
    return null;
  }

  const visibleProducts = products.slice(
    0,
    showAll ? MAX_PRODUCTS_COUNT : INITIAL_PRODUCTS_COUNT,
  );

  const hasMoreProducts = products.length > INITIAL_PRODUCTS_COUNT;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">محصولات مرتبط</h2>

        {hasMoreProducts && (
          <button
            type="button"
            onClick={() => setShowAll((previous) => !previous)}
            className="text-xs font-medium text-green-600 transition hover:text-green-700"
          >
            {showAll ? "مشاهده کمتر" : "مشاهده بیشتر"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 transition-all duration-500 md:grid-cols-4">
        {visibleProducts.map((product) => {
          const imageUrl = product.productImageUrl
            ? getImageUrl(product.productImageUrl)
            : null;

          return (
            <article
              key={product.code}
              className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* لینک جزئیات روی کارت */}
              <Link
                href={`/product/${product.code}`}
                aria-label={`مشاهده جزئیات ${product.name}`}
                className="absolute inset-0 z-10"
              />

              <div className="h-32 overflow-hidden bg-gray-100">
                <img
                  src={imageUrl ?? "/images/default-product.jpg"}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-3">
                <h3 className="line-clamp-1 text-xs font-medium text-gray-800">
                  {product.name}
                </h3>

                <div className="mt-3">
                  <span className="text-xs font-bold text-green-700">
                    {formatPrice(product.wholesalePrice)} تومان
                  </span>

                  <span className="mr-1 text-[10px] text-gray-400">
                    عمده‌فروشی
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-green-700">
                      {formatPrice(product.retailPrice)} تومان
                    </span>

                    <span className="mr-1 block text-[10px] text-gray-400">
                      خرده‌فروشی
                    </span>
                  </div>

                  {onAddToCart && (
                    <button
                      type="button"
                      aria-label={`افزودن ${product.name} به سبد خرید`}
                      onClick={() => onAddToCart(product.code)}
                      className="relative z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-600 hover:text-white"
                    >
                      <ShoppingCartIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasMoreProducts && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((previous) => !previous)}
            className="rounded-xl border border-green-600 px-6 py-2.5 text-xs font-medium text-green-600 transition hover:bg-green-600 hover:text-white"
          >
            {showAll
              ? "جمع کردن محصولات"
              : `مشاهده ${Math.min(products.length, MAX_PRODUCTS_COUNT)} محصول`}
          </button>
        </div>
      )}
    </section>
  );
}
