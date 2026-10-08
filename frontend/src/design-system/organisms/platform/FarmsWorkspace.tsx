"use client";
import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { request, paged } from "@/lib/actions/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { dateLabel, money } from "@/shared/utils/platform";
import useDebounce from "@/shared/hooks/useDebounce";
import QueryState from "@/design-system/molecules/platform/QueryState";
import ChatRoomLink from "@/design-system/molecules/platform/ChatRoomLink";
import { SkeletonBlock } from "@/design-system/molecules/platform/Skeleton";
import { TextField } from "@/design-system/molecules/platform/FormField";
import InfiniteScrollTrigger from "@/design-system/molecules/platform/InfiniteScrollTrigger";
import Map from "@/design-system/organisms/dashbord/map/Map";
import ProductsWorkspace from "./ProductsWorkspace";
import SafeArticleContent from "@/design-system/molecules/platform/SafeArticleContent";
type FarmListItem = {
  farmCode: string;
  farmName: string;
  description?: string;
  farmImageUrl?: string;
  userCode: string;
  userFullName: string;
  userImageUrl?: string;
};
type Farm = {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  ownerCode: string;
  capacity?: number;
  minPurchase: number;
  createdAt: string;
  address?: {
    provinceName: string;
    countyName: string;
    cityName?: string;
    street: string;
    latitude?: number;
    longitude?: number;
  };
};
export function FarmProfile({
  code,
  dashboard = false,
}: {
  code: string;
  dashboard?: boolean;
}) {
  const query = useQuery({
    queryKey: ["platform", "farm", code],
    queryFn: () => request<Farm>("/Farm/GetByCode", { params: { code } }),
  });
  const item = query.data;
  const ownerFarms = useQuery({
    queryKey: ["platform", "farm-owner", item?.ownerCode],
    queryFn: () =>
      paged<FarmListItem>(
        "/Farm/GetByFilter",
        { UserCode: item!.ownerCode, PageSize: 100 },
        true,
      ),
    enabled: !!item?.ownerCode,
  });
  const owner = ownerFarms.data?.items.find((farm) => farm.farmCode === code);
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href={dashboard ? "/dashboard/farm/myFarms" : "/farm"}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
      >
        <ArrowRightIcon className="h-4 w-4" />
        بازگشت به مزارع
      </Link>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!item}
        retry={() => query.refetch()}
        skeleton="detail"
      >
        {item && (
          <>
            <section className="mb-7 overflow-hidden rounded-3xl border border-emerald-100/80 bg-white shadow-[0_18px_55px_-38px_rgba(6,95,70,0.35)]">
              <div className="grid md:grid-cols-[minmax(280px,0.82fr)_1.18fr]">
              <div className="relative min-h-64 bg-gradient-to-br from-emerald-50 to-lime-100 sm:min-h-80 md:min-h-[420px]">
                <Image
                  src={getImageUrl(item.imageUrl)}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 95vw, 320px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  مزرعه فعال در الو گیاه
                </span>
              </div>
              <div className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-10">
                <div className="mb-5">
                  <p className="mb-2 text-xs font-bold tracking-wide text-emerald-700">آشنایی با مزرعه</p>
                  <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{item.name}</h1>
                </div>
                {item.address && (
                  <p className="mb-5 flex items-start gap-2 text-sm leading-6 text-slate-500">
                    <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{[item.address.provinceName, item.address.countyName, item.address.cityName].filter(Boolean).join("، ")}</span>
                  </p>
                )}
                <div className="min-w-0 text-sm leading-7 text-slate-600">
                  <SafeArticleContent
                    content={item.description || "توضیحی برای این مزرعه ثبت نشده است."}
                  />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50/80 p-4">
                    <CalendarDaysIcon className="mb-3 h-5 w-5 text-emerald-700" />
                    <p className="text-[11px] text-slate-500">تاریخ ثبت</p>
                    <p className="mt-1 text-xs font-bold text-slate-800">{dateLabel(item.createdAt)}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50/80 p-4">
                    <ShoppingBagIcon className="mb-3 h-5 w-5 text-amber-700" />
                    <p className="text-[11px] text-slate-500">حداقل خرید</p>
                    <p className="mt-1 text-xs font-bold text-slate-800">{money(item.minPurchase)}</p>
                  </div>
                  {item.capacity != null && (
                    <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                      <Squares2X2Icon className="h-5 w-5 shrink-0 text-slate-500" />
                      <div>
                        <p className="text-[11px] text-slate-500">ظرفیت مزرعه</p>
                        <p className="mt-1 text-xs font-bold text-slate-800">{item.capacity.toLocaleString("fa-IR")}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <UserCircleIcon className="h-5 w-5 text-emerald-700" />
                    فروشنده‌ی این مزرعه
                  </div>
                  {ownerFarms.isLoading ? (
                    <div className="flex items-center gap-3" role="status" aria-label="در حال دریافت اطلاعات فروشنده">
                      <SkeletonBlock className="h-11 w-11 rounded-full" />
                      <SkeletonBlock className="h-4 w-32" />
                    </div>
                  ) : owner ? (
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700">
                        {owner.userImageUrl ? (
                          <Image
                            src={getImageUrl(owner.userImageUrl)}
                            alt={owner.userFullName}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="h-7 w-7" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {owner.userFullName || "فروشنده الو گیاه"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">مدیریت و عرضه محصولات این مزرعه</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">اطلاعات فروشنده در دسترس نیست.</p>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-3 pt-6">
                  {dashboard ? (
                    <>
                      <Link
                        href={`/dashboard/farm/myFarms/${encodeURIComponent(code)}/edit`}
                        className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-xs font-bold text-emerald-700"
                      >
                        ویرایش مزرعه
                      </Link>
                      <Link
                        href={`/dashboard/farm/myFarms/${encodeURIComponent(code)}/farmProducts`}
                        className="rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white"
                      >
                        مدیریت محصولات
                      </Link>
                      <Link
                        href={`/dashboard/farm/myFarms/${encodeURIComponent(code)}/farmProducts/addFarmProducts`}
                        className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"
                      >
                        ثبت محصول
                      </Link>
                    </>
                  ) : (
                    item.ownerCode && (
                      <ChatRoomLink
                        receiverCode={item.ownerCode}
                        contextName={item.name}
                        contextType="گلخانه"
                        className="rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white"
                      >
                        گفت‌وگو با فروشنده
                      </ChatRoomLink>
                    )
                  )}
                </div>
              </div>
              </div>
            </section>
            {typeof item.address?.latitude === "number" &&
              Number.isFinite(item.address.latitude) &&
              typeof item.address?.longitude === "number" &&
              Number.isFinite(item.address.longitude) && (
                <section className="relative z-0 mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                  <div className="mb-4 flex items-center gap-3 px-1">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <MapPinIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-bold text-slate-800">موقعیت مزرعه</h2>
                      <p className="mt-1 text-xs text-slate-500">نمایش موقعیت ثبت‌شده روی نقشه</p>
                    </div>
                  </div>
                  <div className="relative z-0 h-64 overflow-hidden rounded-2xl sm:h-80 lg:h-[420px]">
                    <Map
                      position={[item.address.latitude, item.address.longitude]}
                      className="h-full"
                    />
                  </div>
                </section>
              )}
            <ProductsWorkspace farmCode={code} />
          </>
        )}
      </QueryState>
    </div>
  );
}
export default function FarmsWorkspace() {
  const [search, setSearch] = useState("");
  const term = useDebounce(search, 350);
  const query = useInfiniteQuery({
    queryKey: ["platform", "farms", term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      paged<FarmListItem>(
        "/Farm/GetByFilter",
        { Name: term || undefined, PageNumber: pageParam, PageSize: 12 },
        true,
        signal,
      ),
    getNextPageParam: (last, pages) =>
      last.items.length === 12 ? pages.length + 1 : undefined,
  });
  const farms = query.data?.pages.flatMap((p) => p.items) || [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold text-emerald-700">
          میدان بار مجازی گل و گیاه
        </p>
        <h1 className="text-2xl font-bold text-slate-800">مزارع الو گیاه</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          تولیدکننده‌ها را بشناس و محصولات هر مزرعه را مستقیم بررسی کن.
        </p>
      </div>
      <div className="mb-6 max-w-md">
        <TextField
          label="جست‌وجوی مزرعه"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!farms.length}
        retry={() => query.refetch()}
        skeleton="cards"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Link
              key={farm.farmCode}
              href={`/farm/${encodeURIComponent(farm.farmCode)}`}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
            >
              <div className="relative h-48 bg-emerald-50">
                <Image
                  src={getImageUrl(farm.farmImageUrl)}
                  alt={farm.farmName}
                  fill
                  sizes="(max-width: 640px) 95vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h2 className="mb-3 font-bold">{farm.farmName}</h2>
                <p className="mb-3 text-xs text-emerald-700">
                  {farm.userFullName}
                </p>
                <p className="line-clamp-3 text-sm leading-7 text-slate-500">
                  {farm.description}
                </p>
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
