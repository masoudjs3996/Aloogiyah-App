"use client";

import { useProducts } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { CardSkeleton } from "@/design-system/molecules/platform/Skeleton";
import ProductPrice from "@/design-system/molecules/public/ProductPrice";

export default function ProductCard() {
  const { categories, search } = useSelector(
    (state: any) => state.productFilter,
  );

  const { products, isLoading } = useProducts({
    categoryCodes: [categories],
    name: search,
  });

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 4 }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-10 text-center text-gray-700">محصولی یافت نشد.</div>
    );
  }

  return (
    <>
      {products.map((product) => {
        const isOutOfStock = product.stock === 0;

        return (
          <article
            key={product.code}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
          >
            {/* با کلیک روی هر قسمت کارت، وارد جزئیات محصول می‌شود */}
            <Link
              href={`/product/${product.code}`}
              aria-label={`مشاهده جزئیات ${product.name}`}
              className="absolute inset-0 z-10"
            />

            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100">
              {product.primaryImageUrl ? (
                <Image
                  src={
                    getImageUrl(product.primaryImageUrl) ??
                    "/placeholder.svg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Image
                  src="/placeholder.svg"
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              )}

              {product.stock < 20 && product.stock > 0 && (
                <div className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow">
                  فقط {product.stock}
                </div>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-sm font-bold text-white">ناموجود</span>
                </div>
              )}

            </div>

            <div className="space-y-3 p-4">
              <h3 className="line-clamp-2 min-h-12 text-sm font-bold leading-6 text-slate-900 sm:text-base">
                {product.name}
              </h3>

              <p className="line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                {product.description || "گل تازه و معطر"}
              </p>

              <div className="flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-3">
                <ProductPrice
                  retailPrice={product.retailPrice}
                  wholesalePrice={product.wholesalePrice}
                  compact
                />
                <span className="text-[11px] text-slate-400">
                  {isOutOfStock ? "ناموجود" : `موجودی ${product.stock.toLocaleString("fa-IR")}`}
                </span>
              </div>

              <span className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white transition group-hover:bg-emerald-800">
                مشاهده جزئیات
                <span aria-hidden="true">←</span>
              </span>
            </div>
          </article>
        );
      })}
    </>
  );
}
