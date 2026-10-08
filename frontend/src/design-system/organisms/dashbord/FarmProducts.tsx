"use client";

import Button from "@/design-system/atoms/Button";
import ProductCard from "@/design-system/molecules/dashbord/FarmProductCard";
import { useProducts } from "@/hooks/queries/useProduct";
import { IAgriculturalProduct } from "@/shared/types/product";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import ProductPrice from "@/design-system/molecules/public/ProductPrice";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid2X2,
  List,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  BarChart3,
} from "lucide-react";

import Link from "next/link";
import { useMemo, useState } from "react";

type ProductItem = {
  code: string;
  name: string;
  category: string;
  retailPrice: number;
  wholesalePrice?: number;
  primaryImageUrl?: string;
  isActive: boolean;
};

const FarmProducts = ({ fermCode }: { fermCode: string }) => {
  const { products, isLoading } = useProducts({
    farmCode: fermCode,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("همه دسته‌ها");
  const [sort, setSort] = useState("جدیدترین");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const dynamicProducts: ProductItem[] = useMemo(() => {
    if (!products) return [];

    return products.map((product: IAgriculturalProduct) => ({
      code: product.code,
      name: product.name,
      category: "محصولات مزرعه",
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      primaryImageUrl: product.primaryImageUrl,
      isActive: true,
    }));
  }, [products]);

  const allProducts = dynamicProducts;

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(allProducts.map((product) => product.category)),
    );

    return ["همه دسته‌ها", ...uniqueCategories];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search
    if (search.trim()) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Category
    if (category !== "همه دسته‌ها") {
      result = result.filter((product) => product.category === category);
    }

    // Sort
    if (sort === "ارزان‌ترین") {
      result.sort((a, b) => a.retailPrice - b.retailPrice);
    }

    if (sort === "گران‌ترین") {
      result.sort((a, b) => b.retailPrice - a.retailPrice);
    }

    return result;
  }, [allProducts, search, category, sort]);

  const pageSize = 8;

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div dir="rtl" className="flex min-h-full flex-col bg-[#fafcfb] p-4 md:p-6">
      {/* ================= HEADER ================= */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17212b]">لیست محصولات</h1>

          <p className="mt-2 text-sm text-gray-500">
            در این بخش می‌توانید محصولات مزرعه خود را مدیریت کنید.
          </p>
        </div>

        <Link
          href={`/dashboard/farm/myFarms/${fermCode}/farmProducts/addFarmProducts`}
        >
          <Button variant="success">+ افزودن محصول جدید</Button>
        </Link>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center">
        {/* Search */}
        <div className="relative w-full xl:max-w-[280px]">
          <Search
            size={19}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="جستجو در محصولات..."
            className="
              h-11
              w-full
              rounded-xl
              border
              border-gray-200
              bg-white
              pr-11
              pl-4
              text-sm
              outline-none
              transition
              focus:border-green-500
              focus:ring-2
              focus:ring-green-100
            "
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Category */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="
                h-11
                min-w-[160px]
                appearance-none
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                pl-10
                text-sm
                outline-none
                focus:border-green-500
              "
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="
                h-11
                min-w-[170px]
                appearance-none
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                pl-10
                text-sm
                outline-none
                focus:border-green-500
              "
            >
              <option>جدیدترین</option>
              <option>ارزان‌ترین</option>
              <option>گران‌ترین</option>
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>

          {/* Filter */}
          <button
            type="button"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-gray-200
              bg-white
              text-gray-500
              transition
              hover:bg-gray-50
            "
          >
            <Filter size={18} />
          </button>

          {/* View */}
          <div className="flex h-11 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex w-12 items-center justify-center transition ${
                view === "list" ? "bg-green-50 text-green-600" : "text-gray-500"
              }`}
            >
              <List size={19} />
            </button>

            <button
              type="button"
              onClick={() => setView("grid")}
              className={`flex w-12 items-center justify-center transition ${
                view === "grid" ? "bg-green-50 text-green-600" : "text-gray-500"
              }`}
            >
              <Grid2X2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= PRODUCTS ================= */}

      {isLoading ? (
        <div
          className="
            grid
            grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-3"
            >
              <div className="h-36 animate-pulse rounded-xl bg-gray-200 sm:h-44" />
              <div className="space-y-3 p-2 pt-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <div className="mb-3 text-5xl">🌱</div>

          <h3 className="text-lg font-bold text-gray-700">محصولی پیدا نشد</h3>

          <p className="mt-2 text-sm text-gray-400">
            عبارت جستجو یا فیلترهای انتخابی را تغییر دهید.
          </p>
        </div>
      ) : view === "grid" ? (
        <div
          className="
            grid
            grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {paginatedProducts.map((product) => (
            <div
              key={product.code}
              className="
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                border-gray-200
                bg-white
                shadow-[0_2px_12px_rgba(0,0,0,0.03)]
                transition-all
                duration-200
                hover:-translate-y-1
                hover:shadow-lg
              "
            >
              {/* Image */}
              <div className="relative p-3 pb-0">
                <div className="relative h-[180px] overflow-hidden rounded-xl bg-gray-100">
                  {product.primaryImageUrl ? (
                    <img
                      src={
                        product.primaryImageUrl.startsWith("http")
                          ? product.primaryImageUrl
                          : getImageUrl(product.primaryImageUrl)
                      }
                      alt={product.name}
                      className="
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-300
                        group-hover:scale-105
                      "
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      🌱
                    </div>
                  )}

                  {/* Active badge */}
                  {product.isActive && (
                    <span
                      className="
                        absolute
                        right-3
                        top-3
                        rounded-full
                        bg-white
                        px-3
                        py-1
                        text-xs
                        font-bold
                        text-green-600
                        shadow-sm
                      "
                    >
                      فعال
                    </span>
                  )}

                  {/* Three dots */}
                  <button
                    type="button"
                    className="
                      absolute
                      left-2
                      top-2
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      bg-white/90
                      text-gray-700
                      shadow-sm
                      backdrop-blur
                    "
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <Link
                  href={`/dashboard/farm/myFarms/${fermCode}/farmProducts/${product.code}`}
                  className="block"
                >
                  <h3 className="truncate text-[17px] font-bold text-gray-800">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <span>♧</span>
                    <span>{product.category}</span>
                  </div>

                  <div className="mt-3 text-base">
                    <ProductPrice retailPrice={product.retailPrice} wholesalePrice={product.wholesalePrice} compact />
                  </div>
                </Link>

                {/* Actions */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="
                      flex
                      h-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-gray-100
                      bg-gray-50
                      text-red-500
                      transition
                      hover:bg-red-50
                    "
                  >
                    <Trash2 size={17} />
                  </button>

                  <Link
                    href={`/dashboard/farm/myFarms/${encodeURIComponent(fermCode)}/farmProducts/${encodeURIComponent(product.code)}/edit`}
                    className="
                      flex
                      h-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-gray-100
                      bg-gray-50
                      text-green-600
                      transition
                      hover:bg-green-50
                    "
                  >
                    <Pencil size={17} />
                  </Link>

                  <Link
                    href={`/dashboard/farm/myFarms/${fermCode}/farmProducts/${product.code}`}
                    className="
                      flex
                      h-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-gray-100
                      bg-gray-50
                      text-gray-500
                      transition
                      hover:bg-gray-100
                    "
                  >
                    <BarChart3 size={17} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="flex flex-col gap-3">
          {paginatedProducts.map((product) => (
            <div
              key={product.code}
              className="
                flex
                items-center
                gap-4
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-3
              "
            >
              <img
                src={
                  product.primaryImageUrl?.startsWith("http")
                    ? product.primaryImageUrl
                    : getImageUrl(product.primaryImageUrl)
                }
                alt={product.name}
                className="h-20 w-24 rounded-xl object-cover"
              />

              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{product.name}</h3>

                <p className="mt-1 text-xs text-gray-400">{product.category}</p>
              </div>

              <div className="text-base">
                <ProductPrice retailPrice={product.retailPrice} wholesalePrice={product.wholesalePrice} compact />
              </div>

              <Link
                href={`/dashboard/farm/myFarms/${encodeURIComponent(fermCode)}/farmProducts/${encodeURIComponent(product.code)}/edit`}
                className="rounded-lg p-2 text-green-600 hover:bg-green-50"
              >
                <Pencil size={18} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="mt-8 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-gray-500">
          نمایش{" "}
          <b className="text-gray-700">
            {filteredProducts.length === 0 ? 0 : (page - 1) * pageSize + 1}
          </b>{" "}
          تا{" "}
          <b className="text-gray-700">
            {Math.min(page * pageSize, filteredProducts.length)}
          </b>{" "}
          از <b className="text-gray-700">{filteredProducts.length}</b> محصول
        </span>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              border
              border-gray-200
              bg-white
              text-gray-500
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <ChevronRight size={18} />
          </button>

          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`
                  flex
                  h-10
                  min-w-10
                  items-center
                  justify-center
                  rounded-lg
                  px-3
                  text-sm
                  font-medium
                  transition
                  ${
                    page === pageNumber
                      ? "bg-green-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                {new Intl.NumberFormat("fa-IR").format(pageNumber)}
              </button>
            );
          })}

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              border
              border-gray-200
              bg-white
              text-gray-500
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmProducts;
