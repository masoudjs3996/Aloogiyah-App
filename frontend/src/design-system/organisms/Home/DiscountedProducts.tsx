"use client";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { paged } from "@/lib/actions/platform";
import type { StoreProduct } from "@/shared/types/platform";
import { StoreProductCard } from "../platform/ProductsWorkspace";
import QueryState from "@/design-system/molecules/platform/QueryState";

export default function DiscountedProducts() {
  const [now, setNow] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ["platform", "discounted-products"],
    queryFn: ({ signal }) => paged<StoreProduct>("/AgriculturalProduct/GetByFilter", {
      DiscountedOnly: true, PageSize: 8,
    }, false, signal),
    refetchInterval: query => axios.isAxiosError(query.state.error) && query.state.error.response?.status === 429 ? false : 180000,
  });
  useEffect(() => {
    if (!query.data?.items.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [query.data]);
  const products = (query.data?.items ?? []).filter((product) =>
    !!product.discountEndsAt && new Date(product.discountEndsAt).getTime() > now);
  return <section className="mb-12 mt-6" aria-labelledby="home-discounts-title">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div><p className="mb-1 text-xs font-bold text-rose-600">فرصت محدود</p><h2 id="home-discounts-title" className="text-xl font-black text-slate-900 sm:text-2xl">آگهی‌های دارای تخفیف</h2></div>
      <Link href="/product?discountedOnly=true" className="shrink-0 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-rose-700">همه تخفیف‌ها ←</Link>
    </div>
    <QueryState loading={query.isLoading} error={query.error} empty={!products.length} retry={() => void query.refetch()} emptyText="در حال حاضر محصول تخفیف‌داری موجود نیست" skeleton="products">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{products.map((product) => <StoreProductCard key={product.code} product={product} />)}</div>
    </QueryState>
  </section>;
}
