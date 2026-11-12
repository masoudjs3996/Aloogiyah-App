"use client";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { errorMessage, request, paged } from "@/lib/actions/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { money } from "@/shared/utils/platform";
import { persianDate } from "@/shared/utils/persian-date";
import useDebounce from "@/shared/hooks/useDebounce";
import QueryState from "@/design-system/molecules/platform/QueryState";
import ChatRoomLink from "@/design-system/molecules/platform/ChatRoomLink";
import { SkeletonBlock } from "@/design-system/molecules/platform/Skeleton";
import { TextField } from "@/design-system/molecules/platform/FormField";
import InfiniteScrollTrigger from "@/design-system/molecules/platform/InfiniteScrollTrigger";
import Map from "@/design-system/organisms/dashbord/map/Map";
import { locationPreviewHeight } from "@/design-system/organisms/dashbord/map/mapStyles";
import ProductsWorkspace from "./ProductsWorkspace";
import ActionBar from "@/design-system/molecules/platform/ActionBar";
import FarmCard from "@/design-system/molecules/public/FarmCard";
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
export type Farm = {
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
    villageName?: string;
    street: string;
    latitude?: number;
    longitude?: number;
  };
};

function FarmContact({ code }: { code: string }) {
  const router = useRouter();
  const contact = useMutation({
    mutationFn: () => request<{ phoneNumber: string | null }>("/Farm/Contact", { params: { code } }),
  });
  const phone = contact.data?.phoneNumber;
  return (
    <div className="mt-4 border-t border-slate-200 pt-3" aria-live="polite">
      {phone ? (
        <a href={`tel:${phone}`} className="inline-flex min-h-11 max-w-full flex-wrap items-center gap-x-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-800">
          <PhoneIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          تماس با مزرعه‌دار <bdi dir="ltr">{phone}</bdi>
        </a>
      ) : contact.isSuccess ? (
        <p className="text-xs leading-6 text-slate-600">شمارهٔ تماسی ثبت نشده است.</p>
      ) : (
        <>
          <button type="button" disabled={contact.isPending} aria-busy={contact.isPending}
            onClick={() => Cookies.get("token") ? contact.mutate() : router.push("/Login")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-800 disabled:opacity-60">
            <PhoneIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {contact.isPending ? "در حال دریافت شماره…" : "نمایش شماره تماس"}
          </button>
          {contact.isError && <p className="mt-2 text-xs leading-6 text-red-700">{errorMessage(contact.error)}</p>}
        </>
      )}
    </div>
  );
}

export function FarmProfile({
  code,
  dashboard = false,
  initialFarm,
}: {
  code: string;
  dashboard?: boolean;
  initialFarm?: Farm;
}) {
  const query = useQuery({
    queryKey: ["platform", "farm", code],
    queryFn: () => request<Farm>("/Farm/GetByCode", { params: { code } }),
    initialData: initialFarm,
  });
  const item = query.data;
  const address = item?.address;
  const fullAddress = [address?.provinceName, address?.countyName, address?.villageName || address?.cityName, address?.street]
    .map(part => part?.trim()).filter(Boolean).join("، ");
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
                    <p className="mt-1 text-xs font-bold text-slate-800">{persianDate(item.createdAt, true, dashboard ? undefined : "Asia/Tehran")}</p>
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
                        <p className="mt-1 text-[11px] text-slate-500">مدیریت و عرضه آگهی‌های این مزرعه</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">اطلاعات فروشنده در دسترس نیست.</p>
                  )}
                  <FarmContact key={item.code} code={item.code} />
                </div>
                <ActionBar className="mt-auto pt-6">
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
                        مدیریت آگهی‌ها
                      </Link>
                      <Link
                        href={`/dashboard/farm/myFarms/${encodeURIComponent(code)}/farmProducts/addFarmProducts`}
                        className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"
                      >
                        ثبت آگهی
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
                </ActionBar>
              </div>
              </div>
            </section>
            {fullAddress && (
              <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-800">
                  <MapPinIcon className="h-5 w-5 text-emerald-700" />
                  نشانی مزرعه
                </h2>
                <p className="break-words text-sm leading-7 text-slate-600">{fullAddress}</p>
              </section>
            )}
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
                  <div className={`relative z-0 overflow-hidden rounded-2xl ${locationPreviewHeight}`}>
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
          تولیدکننده‌ها را بشناس و آگهی‌های هر مزرعه را مستقیم بررسی کن.
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
            <FarmCard key={farm.farmCode} farm={farm} />
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
