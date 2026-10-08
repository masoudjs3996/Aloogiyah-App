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
import {
  TextField,
  SelectField,
} from "@/design-system/molecules/platform/FormField";
import ProductPrice from "@/design-system/molecules/public/ProductPrice";
export function StoreProductCard({ product }: { product: StoreProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <Link href={`/product/${encodeURIComponent(product.code)}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-lime-100">
          <Image
            src={imageFailed ? "/placeholder.svg" : getImageUrl(product.primaryImageUrl || product.imageUrl)}
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
          <ProductPrice retailPrice={product.retailPrice} wholesalePrice={product.wholesalePrice} compact />
          <p className="mt-2 text-xs text-slate-400">
            {product.stock > 0 ? `${faNumber(product.stock)} موجود` : "ناموجود"}
          </p>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link
          href={`/product/${encodeURIComponent(product.code)}`}
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
  const [search, setSearch] = useState("");
  // null means no explicit user choice yet; an empty string means "all categories".
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [stockOnly, setStockOnly] = useState(false);
  const [routeCategories, setRouteCategories] = useState<{
    selected: string;
    codes: string[];
  }>({ selected: "", codes: [] });
  const [routeReady, setRouteReady] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRouteCategories({
      selected: params.get("category") ?? "",
      codes: (params.get("categoryCodes") ?? "")
        .split(",")
        .filter(Boolean),
    });
    setRouteReady(true);
  }, []);
  const term = useDebounce(search || global.search || "", 350);
  const categories = useQuery<ICategoryTree[]>({
    queryKey: ["platform", "categories"],
    queryFn: async () => (await getCategoryTree())?.data ?? [],
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
      stockOnly,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      paged<StoreProduct>(
        "/AgriculturalProduct/GetByFilter",
        {
          FarmCode: farmCode,
          Name: term || undefined,
          CategoryCodes: selectedCategoryCodes,
          MinStock: stockOnly ? 1 : undefined,
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
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold text-emerald-700">
          میدان بار مجازی گل و گیاه
        </p>
        <h1 className="text-2xl font-bold text-slate-800">محصولات الو گیاه</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          محصولات را از مزارع پیدا کن، مشخصاتشان را مقایسه کن و با فروشنده در ارتباط باش.
        </p>
      </div>
      <div className="mb-7 grid items-end gap-4 sm:grid-cols-3">
        <TextField
          label="جست‌وجوی محصول"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="نام محصول"
        />
        <SelectField
          label="دسته‌بندی"
          value={selectedCategory}
          onChange={(e) => setCategoryOverride(e.target.value)}
        >
          <option value="">همه دسته‌ها</option>
          {flatCategories.map(({ category: item, depth }) => (
            <option key={item.code} value={item.code}>
              {`${"　".repeat(depth)}${item.name}`}
            </option>
          ))}
        </SelectField>
        <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={(e) => setStockOnly(e.target.checked)}
          />
          فقط کالاهای موجود
        </label>
      </div>
      <QueryState
        loading={!routeReady || query.isLoading}
        error={query.error}
        empty={!products.length}
        retry={() => query.refetch()}
        emptyText="محصولی با این مشخصات پیدا نشد"
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
        label="در حال دریافت محصولات…"
      />
    </div>
  );
}
