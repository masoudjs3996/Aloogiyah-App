"use client";

import { useProducts } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import { BiHeart } from "react-icons/bi";
import { FaShoppingCart } from "react-icons/fa";

export default function ProductCard() {
  const { products, isLoading } = useProducts();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
  };

  if (isLoading) {
    return (
      <div className="text-center py-10 text-gray-500">
        در حال بارگذاری محصولات...
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10 text-gray-700">محصولی یافت نشد.</div>
    );
  }

  return (
    <>
      {products.map((product) => {
        const hasDiscount = product.wholesalePrice < product.retailPrice;

        return (
          <div
            key={product.code} // ← خیلی مهمه! key رو فراموش کردی
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
          >
         
            <div className="relative aspect-square overflow-hidden bg-gray-500 min-h-[250px]">
              {product?.primaryImageUrl && (
                <Image
                  src={
                    getImageUrl(product?.primaryImageUrl) ??
                    "/images/default-product.jpg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
    
                />
              )}

              {/* Badge موجودی کم */}
              {product.stock < 20 && product.stock > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow">
                  فقط {product.stock}
                </div>
              )}

              {/* ناموجود */}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">ناموجود</span>
                </div>
              )}

              {/* دکمه علاقه‌مندی */}
              <button className="absolute top-2 left-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition">
                <BiHeart className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* محتوای کارت */}
            <div className="p-3 space-y-2">
              <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-tight">
                {product.name}
              </h3>

              <p className="text-xs text-gray-500 line-clamp-2">
                {product.description || "گل تازه و معطر"}
              </p>

              {/* قیمت */}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(product.retailPrice)}
                  </span>
                  {hasDiscount && (
                    <div className="text-xs text-gray-400 line-through">
                      {formatPrice(product.wholesalePrice)}
                    </div>
                  )}
                </div>

                {hasDiscount && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    تخفیف
                  </span>
                )}
              </div>

              {/* دکمه افزودن */}
              <button
                disabled={product.stock === 0}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  product.stock > 0
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-sm"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FaShoppingCart className="w-4 h-4" />
                {product.stock > 0 ? "افزودن" : "ناموجود"}
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
