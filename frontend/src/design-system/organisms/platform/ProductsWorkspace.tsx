"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { paged } from "@/lib/actions/platform";
import type { StoreProduct } from "@/shared/types/platform";
import { getCategoryTree } from "@/lib/actions/categories";
import type { ICategoryTree } from "@/shared/types/categories";
import { faNumber } from "@/shared/utils/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import useDebounce from "@/shared/hooks/useDebounce";
import QueryState from "@/design-system/molecules/platform/QueryState";
import InfiniteScrollTrigger from "@/design-system/molecules/platform/InfiniteScrollTrigger";
import { TextField } from "@/design-system/molecules/platform/FormField";
import ProductFiltersDialog from "./ProductFiltersDialog";
import { SlidersHorizontal, X } from "lucide-react";
import {
  emptyProductFilters,
  productFilterParams,
  productFilterCount,
  productSortOptions,
  type ProductFilters,
} from "@/shared/utils/product-filters";
import ProductPrice from "@/design-system/molecules/public/ProductPrice";
import { publicDetailPath } from "@/shared/utils/public-detail-path";
export function StoreProductCard({ product }: { product: StoreProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <Link href={publicDetailPath("product", product.code, product.name)}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100">
          <Image
            src={
              imageFailed
                ? "/placeholder.svg"
                : getImageUrl(product.primaryImageUrl || product.imageUrl)
            }
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        </div>
        <div className="p-4">
          <h2 className="mb-3 line-clamp-2 text-sm font-bold leading-7 text-slate-800">
            {product.name}
          </h2>
          <ProductPrice
            retailPrice={product.retailPrice}
            wholesalePrice={product.wholesalePrice}
            saleUnit={product.saleUnit} offer={product}
            compact
            stockLabel={product.stock > 0 ? `${faNumber(product.stock)} موجود` : "ناموجود"}
          />
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link
          href={publicDetailPath("product", product.code, product.name)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
        >
          مشاهده جزئیات
          <span aria-hidden="true">←</span>
        </Link>
      </div>
    </article>
  );
}

function flattenCategories(
  categories: ICategoryTree[],
  depth = 0,
): Array<{ category: ICategoryTree; depth: number }> {
  return categories.flatMap((category) => [
    { category, depth },
    ...flattenCategories(category.subCategories ?? [], depth + 1),
  ]);
}

function collectCategoryCodes(category: ICategoryTree): string[] {
  return [
    category.code,
    ...(category.subCategories ?? []).flatMap(collectCategoryCodes),
  ];
}

export default function ProductsWorkspace({ farmCode }: { farmCode?: string }) {
  const global = useSelector(
    (state: { productFilter: { search?: string; categories?: string } }) =>
      state.productFilter,
  );
  const [search, setSearch] = useState<string | null>(null);
  // null means no explicit user choice yet; an empty string means "all categories".
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    ...emptyProductFilters,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusCode, setStatusCode] = useState("");
  const [routeCategories, setRouteCategories] = useState<{
    selected: string;
    codes: string[];
  }>({ selected: "", codes: [] });
  const [routeReady, setRouteReady] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters((current) => ({
      ...current,
      discountedOnly: false,
    }));
    setStatusCode(params.get("statusCode") ?? "");
    setRouteCategories({
      selected: params.get("category") ?? "",
      codes: (params.get("categoryCodes") ?? "").split(",").filter(Boolean),
    });
    setRouteReady(true);
  }, []);
  const term = useDebounce(search ?? global.search ?? "", 350);
  const categories = useQuery<ICategoryTree[]>({
    queryKey: ["platform", "categories"],
    queryFn: async () => {
      const response = await getCategoryTree();
      if (!response?.isSuccess)
        throw new Error(response?.message || "دریافت دسته‌بندی‌ها ناموفق بود");
      return response.data ?? [];
    },
  });
  const flatCategories = useMemo(
    () => flattenCategories(categories.data ?? []),
    [categories.data],
  );
  const selectedCategory =
    categoryOverride !== null
      ? categoryOverride
      : routeCategories.selected || global.categories || "";
  const selectedCategoryCodes = useMemo(() => {
    if (categoryOverride !== null) {
      if (!categoryOverride) return undefined;
      const selected = flatCategories.find(
        ({ category: item }) => item.code === categoryOverride,
      )?.category;
      return selected ? collectCategoryCodes(selected) : [categoryOverride];
    }
    if (routeCategories.codes.length) return routeCategories.codes;
    const preselected = routeCategories.selected || global.categories;
    if (!preselected) return undefined;
    const selected = flatCategories.find(
      ({ category: item }) => item.code === preselected,
    )?.category;
    return selected ? collectCategoryCodes(selected) : [preselected];
  }, [categoryOverride, flatCategories, routeCategories, global.categories]);
  const query = useInfiniteQuery({
    queryKey: [
      "platform",
      "store-products",
      farmCode,
      term,
      selectedCategoryCodes,
      filters,
      statusCode,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      paged<StoreProduct>(
        "/AgriculturalListing/GetPage",
        {
          FarmCode: farmCode,
          Name: term || undefined,
          CategoryCodes: selectedCategoryCodes,
          ...productFilterParams(filters),
          StatusCode: statusCode || undefined,
          PageNumber: pageParam,
          PageSize: 12,
        },
        false,
        signal,
      ),
    enabled: routeReady,
    getNextPageParam: (last, pages) =>
      last.items.length === 12 ? pages.length + 1 : undefined,
  });
  const products = useMemo(
    () => [
      ...new Map(
        query.data?.pages.flatMap((p) => p.items).map((p) => [p.code, p]) || [],
      ).values(),
    ],
    [query.data],
  );
  const applied = { ...filters, category: selectedCategory };
  const filterCount = productFilterCount(applied);
  const categoryName = flatCategories.find(
    ({ category }) => category.code === selectedCategory,
  )?.category.name;
  const clearFilters = () => {
    setFilters({ ...emptyProductFilters });
    setCategoryOverride("");
    setStatusCode("");
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold text-emerald-700">
          {farmCode ? "فهرست آگهی‌های مزرعه" : "بازار مستقیم کشاورز و خریدار"}
        </p>
        <h1 className="text-2xl font-bold text-slate-800">{farmCode ? "آگهی‌های این مزرعه" : "آگهی‌های کشاورزی و گل و گیاه"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {farmCode ? "آگهی‌های این مزرعه را ببینید و برای هماهنگی مستقیم، وارد جزئیات هر آگهی شوید." : "آگهی‌های مزارع را پیدا کنید، مشخصاتشان را مقایسه کنید و مستقیم با کشاورز هماهنگ شوید."}
        </p>
      </div>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextField
            label="جست‌وجوی آگهی"
            value={search ?? global.search ?? ""}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="نام آگهی"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-haspopup="dialog"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فیلتر و مرتب‌سازی
          {filterCount > 0 && (
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
              {faNumber(filterCount)}
            </span>
          )}
        </button>
      </div>
      <div
        className="mb-6 flex flex-wrap items-center gap-2 text-xs"
        aria-live="polite"
      >
        <span className="ml-auto text-slate-500">
          مرتب‌سازی:{" "}
          {
            productSortOptions.find((option) => option.value === filters.sort)
              ?.label
          }
        </span>
        {[
          selectedCategory && {
            label: categoryName || "دسته انتخاب‌شده",
            remove: () => setCategoryOverride(""),
          },
          (filters.minPrice || filters.maxPrice) && {
            label: `${filters.minPrice || "۰"} تا ${filters.maxPrice || "بدون سقف"} تومان`,
            remove: () =>
              setFilters({ ...filters, minPrice: "", maxPrice: "" }),
          },
          filters.stockOnly && {
            label: "فقط موجود",
            remove: () => setFilters({ ...filters, stockOnly: false }),
          },
          filters.discountedOnly && {
            label: "تخفیف‌دار",
            remove: () => setFilters({ ...filters, discountedOnly: false }),
          },
        ]
          .filter(
            (item): item is { label: string; remove: () => void } => !!item,
          )
          .map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={item.remove}
              aria-label={`حذف فیلتر ${item.label}`}
              className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 font-semibold text-emerald-800"
            >
              {item.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        {filterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg px-2 py-2 font-bold text-rose-700"
          >
            حذف همه
          </button>
        )}
      </div>
      {filtersOpen && (
        <ProductFiltersDialog
          value={applied}
          categories={categories.data ?? []}
          loading={categories.isLoading}
          categoryError={categories.isError}
          onRetry={() => void categories.refetch()}
          onClose={() => setFiltersOpen(false)}
          onApply={(value) => {
            setFilters(value);
            setCategoryOverride(value.category);
            setFiltersOpen(false);
          }}
        />
      )}
      <QueryState
        loading={!routeReady || query.isLoading}
        error={query.error}
        empty={!products.length}
        retry={() => query.refetch()}
        emptyText="آگهی‌ای با این مشخصات پیدا نشد"
        skeleton="products"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <StoreProductCard key={product.code} product={product} />
          ))}
        </div>
      </QueryState>
      <InfiniteScrollTrigger
        hasNextPage={!!query.hasNextPage}
        isFetching={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
        label="در حال دریافت آگهی‌ها…"
      />
    </div>
  );
}
