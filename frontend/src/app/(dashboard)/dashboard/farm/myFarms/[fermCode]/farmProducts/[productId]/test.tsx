"use client";

import { GetDetailProduct } from "@/lib/actions/product";
import Image from "next/image";
import { useEffect, useState } from "react";

type Product = {
  name: string;
  description: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  dailyProductionCapacity: number;
  imageUrls: string[];
  categoryCodes: string[];
};

const ProductDetailUI = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  console.log(product);

  useEffect(() => {
    const get = async () => {
      setLoading(true);
      const response = await GetDetailProduct(productId);

      setProduct(response.data);
      setLoading(false);
    };

    get();
  }, [productId]);

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-[300px] sm:h-[420px] rounded-2xl bg-gray-200" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-16 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="h-14 w-32 bg-gray-200 rounded-xl" />
            <div className="h-14 w-32 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <p className="text-center py-16 text-sm sm:text-base text-red-500 font-medium">
        محصول پیدا نشد
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
      {/* -------- Image Gallery -------- */}
      <div className="space-y-3">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden border bg-white shadow-sm">
          <Image
            src={`http://localhost:5056${product.imageUrls[activeImage]}`}
            alt={product.name}
            width={600}
            height={600}
            className="w-full h-[280px] sm:h-[420px] object-cover"
          />
        </div>

        {product.imageUrls.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.imageUrls.map((img, index) => (
              <button
                key={img}
                onClick={() => setActiveImage(index)}
                className={`relative min-w-[64px] h-16 rounded-lg overflow-hidden border 
                transition 
                ${
                  activeImage === index
                    ? "ring-2 ring-green-500"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={`http://localhost:5056${img}`}
                  alt=""
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -------- Info -------- */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            {product.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <PriceCard
            title="خرده‌فروشی"
            value={product.retailPrice}
            color="text-green-600"
          />
          <PriceCard
            title="عمده"
            value={product.wholesalePrice}
            color="text-blue-600"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="موجودی" value={`${product.stock} عدد`} />
          <StatCard
            title="تولید روزانه"
            value={`${product.dailyProductionCapacity} عدد`}
          />
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs sm:text-sm text-gray-500 mb-2">دسته‌بندی‌ها</p>
          <div className="flex flex-wrap gap-2">
            {product.categoryCodes.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 text-[11px] sm:text-xs rounded-full 
                bg-gray-100 border text-gray-700"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailUI;

/* ---------- Small Components ---------- */

const PriceCard = ({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) => (
  <div className="rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4 shadow-sm">
    <p className="text-[11px] sm:text-sm text-gray-500">{title}</p>
    <p className={`text-sm sm:text-xl font-bold mt-1 ${color}`}>
      {value.toLocaleString()} تومان
    </p>
  </div>
);

const StatCard = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-xl sm:rounded-2xl border bg-white p-3 sm:p-4">
    <p className="text-[11px] sm:text-sm text-gray-500">{title}</p>
    <p className="text-sm sm:text-lg font-semibold mt-1 text-gray-900">
      {value}
    </p>
  </div>
);
