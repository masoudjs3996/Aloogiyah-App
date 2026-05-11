"use client";

import Button from "@/design-system/atoms/Button";
import useCart from "@/hooks/mutations/useCart";
import { useProducts } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import Link from "next/link";
import { BiHeart } from "react-icons/bi";
import { FaShoppingCart } from "react-icons/fa";

export default function ProductCard() {
  const { products, isLoading } = useProducts();
  const { addCart } = useCart();
  const AddToCard = (proId: string) => {
    addCart.mutate(
      {
        productCode: proId,
        quantity: 1,
      },
      {
        onSuccess: (data) => {
          console.log(data);
        },
        onError: (err) => {
          console.log(err);
        },
      }
    );
  };

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
          <Link href={`/product/${product.code}`} key={product.code}>
            <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
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

                {product.stock < 20 && product.stock > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow">
                    فقط {product.stock}
                  </div>
                )}

                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      ناموجود
                    </span>
                  </div>
                )}

                <button className="absolute top-2 left-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition">
                  <BiHeart className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="p-3 space-y-2">
                <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-tight">
                  {product.name}
                </h3>

                <p className="text-xs line-clamp-2 h-14 my-4">
                  {product.description || "گل تازه و معطر"}
                </p>

                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(product.retailPrice)}
                    </span>
                  </div>

                  <div className="flex justify-between mt-1 h-6">
                    {hasDiscount ? (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.wholesalePrice)}
                      </span>
                    ) : (
                      <div className="mt-1 h-6 invisible">بدون تخفیف</div>
                    )}

                    {hasDiscount && (
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        تخفیف
                      </span>
                    )}
                  </div>
                </div>
                <Button onClick={() => AddToCard(product.code)}>
                  <FaShoppingCart className="w-4 h-4" />
                  <span>{product.stock > 0 ? "افزودن" : "ناموجود"}</span>
                </Button>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}
