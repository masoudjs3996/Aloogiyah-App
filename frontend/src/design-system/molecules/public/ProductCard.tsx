"use client";

import Button from "@/design-system/atoms/Button";
import useCart from "@/hooks/mutations/useCart";
import { useProducts } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { BiHeart } from "react-icons/bi";
import { FaShoppingCart } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function ProductCard() {
  const { categories, search } = useSelector(
    (state: any) => state.productFilter,
  );

  const { products, isLoading } = useProducts({
    categoryCodes: [categories],
    name: search,
  });

  const { addCart } = useCart();

  const addToCart = (productCode: string) => {
    addCart.mutate(
      {
        productCode,
        quantity: 1,
      },
      {
        onSuccess: (data) => {
          toast.success(data?.message);
        },
        onError: (error) => {
          console.error(error);
          toast.error("افزودن محصول به سبد خرید انجام نشد");
        },
      },
    );
  };

  const formatPrice = (price: number) => {
    return `${new Intl.NumberFormat("fa-IR").format(price)} تومان`;
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-gray-500">
        در حال بارگذاری محصولات...
      </div>
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
        const hasDiscount = product.wholesalePrice < product.retailPrice;

        const isOutOfStock = product.stock === 0;

        return (
          <article
            key={product.code}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          >
            {/* با کلیک روی هر قسمت کارت، وارد جزئیات محصول می‌شود */}
            <Link
              href={`/product/${product.code}`}
              aria-label={`مشاهده جزئیات ${product.name}`}
              className="absolute inset-0 z-10"
            />

            <div className="relative aspect-square min-h-[250px] overflow-hidden bg-gray-500">
              {product.primaryImageUrl ? (
                <Image
                  src={
                    getImageUrl(product.primaryImageUrl) ??
                    "/images/default-product.jpg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Image
                  src="/images/default-product.jpg"
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

              {/* این دکمه بالاتر از لینک کارت قرار دارد */}
              <button
                type="button"
                aria-label="افزودن به علاقه‌مندی‌ها"
                className="absolute left-2 top-2 z-20 rounded-full bg-white/80 p-2 shadow backdrop-blur-sm transition hover:bg-white"
              >
                <BiHeart className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 text-base font-bold leading-tight text-gray-900">
                {product.name}
              </h3>

              <p className="my-4 h-14 line-clamp-2 text-xs">
                {product.description || "گل تازه و معطر"}
              </p>

              <div className="flex flex-col justify-between">
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(product.retailPrice)}
                </span>

                <div className="mt-1 flex h-6 items-center justify-between">
                  {hasDiscount ? (
                    <>
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.wholesalePrice)}
                      </span>

                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                        تخفیف
                      </span>
                    </>
                  ) : (
                    <span className="invisible text-xs">بدون تخفیف</span>
                  )}
                </div>
              </div>

              {/* چون از Link جداست، باعث نویگیت نمی‌شود */}
              <div className="relative z-20">
                <Button
                  onClick={() => {
                    if (!isOutOfStock) {
                      addToCart(product.code);
                    }
                  }}
                >
                  <FaShoppingCart className="h-4 w-4" />

                  <span>
                    {isOutOfStock
                      ? "ناموجود"
                      : addCart.isPending
                        ? "در حال افزودن..."
                        : "افزودن"}
                  </span>
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}
