"use client";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { paged } from "@/lib/actions/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import QueryState from "@/design-system/molecules/platform/QueryState";
import { TextField } from "@/design-system/molecules/platform/FormField";
import InfiniteScrollTrigger from "@/design-system/molecules/platform/InfiniteScrollTrigger";
import useDebounce from "@/shared/hooks/useDebounce";
type FarmItem = {
  code: string;
  name: string;
  description?: string;
  farmImageUrl?: string;
  provinceName: string;
  countyName: string;
  statusName: string;
  ownerCode: string;
  capacity?: number;
  address?: { provinceName: string; countyName: string; street: string };
};
export default function MyFarmsWorkspace() {
  const [name, setName] = useState("");
  const term = useDebounce(name, 350);
  const query = useInfiniteQuery({
    queryKey: ["platform", "my-farms", term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      paged<FarmItem>(
        "/Farm/GetMyFarm",
        { Name: term || undefined, PageNumber: pageParam, PageSize: 12 },
        true,
        signal,
      ),
    getNextPageParam: (last, pages) =>
      last.items.length === 12 ? pages.length + 1 : undefined,
  });
  const items = query.data?.pages.flatMap((p) => p.items) || [];
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title="مزرعه‌های من"
        description="اطلاعات ثبت‌شده مزارع و محصولات خود را مدیریت کنید."
        action={
          <Link
            href="/dashboard/farm/registerFarm"
            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
          >
            ثبت مزرعه
          </Link>
        }
      />
      <div className="mb-6 max-w-md">
        <TextField
          label="جست‌وجوی مزرعه"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!items.length}
        retry={() => query.refetch()}
        skeleton="cards"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((farm) => (
            <Link
              key={farm.code}
              href={`/dashboard/farm/myFarms/${encodeURIComponent(farm.code)}`}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
            >
              <div className="relative h-44 bg-emerald-50">
                <Image
                  src={getImageUrl(farm.farmImageUrl)}
                  alt={farm.name}
                  fill
                  sizes="(max-width: 640px) 95vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h2 className="mb-3 font-bold">{farm.name}</h2>
                <p className="mb-3 text-xs text-slate-500">
                  {farm.provinceName}، {farm.countyName} | {farm.statusName}
                </p>
                <p className="line-clamp-3 text-sm leading-7 text-slate-500">
                  {farm.description || "توضیحی ثبت نشده است"}
                </p>
                <span className="mt-5 block text-xs font-bold text-emerald-700">
                  مدیریت مزرعه ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      </QueryState>
      <InfiniteScrollTrigger
        hasNextPage={!!query.hasNextPage}
        isFetching={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
        label="در حال دریافت مزارع…"
      />
    </div>
  );
}
