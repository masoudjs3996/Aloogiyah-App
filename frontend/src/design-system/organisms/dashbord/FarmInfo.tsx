"use client";

import Button from "@/design-system/atoms/Button";
import { useMyFarm } from "@/hooks/queries/useFarm";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ShoppingBagIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface FarmInfoProps {
  fermCode: string;
}

const formatNumber = (value?: number | null) => {
  return new Intl.NumberFormat("fa-IR").format(value ?? 0);
};

const FarmInfoSkeleton = () => {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="h-80 bg-gray-200" />

      <div className="space-y-5 p-6 md:p-8">
        <div className="h-8 w-52 rounded-lg bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-28 rounded-2xl bg-gray-100" />
          <div className="h-28 rounded-2xl bg-gray-100" />
        </div>

        <div className="h-36 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
};

const FarmInfo = ({ fermCode }: FarmInfoProps) => {
  const { farmDetail, farmDetailLoading } = useMyFarm(fermCode);

  if (farmDetailLoading) {
    return <FarmInfoSkeleton />;
  }

  if (!farmDetail?.data) {
    return (
      <div className="mx-auto flex min-h-[400px] w-full max-w-5xl items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50 p-6">
        <div className="text-center">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-red-400" />

          <h2 className="mt-4 font-bold text-gray-800">
            اطلاعات مزرعه یافت نشد
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            اطلاعات این مزرعه در دسترس نیست یا حذف شده است.
          </p>
        </div>
      </div>
    );
  }

  const { name, description, capacity, minPurchase, imageUrl, address } =
    farmDetail.data;

  const farmImage = imageUrl ? getImageUrl(imageUrl) : null;

  const fullAddress = [
    address?.provinceName,
    address?.countyName,
    address?.villageName,
  ]
    .filter(Boolean)
    .join("، ");

  return (
    <section
      dir="rtl"
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_15px_50px_rgba(15,23,42,0.08)]"
    >
      {/* تصویر اصلی مزرعه */}
      <div className="relative h-64 overflow-hidden bg-gray-100 sm:h-80 lg:h-[400px]">
        {farmImage ? (
          <img
            src={farmImage}
            alt={name}
            className="h-full w-full object-cover transition duration-700 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-green-50 to-emerald-100 text-green-700">
            <BuildingStorefrontIcon className="h-16 w-16" />
            <span className="text-sm font-medium">
              تصویری برای مزرعه ثبت نشده است
            </span>
          </div>
        )}

        {/* گرادیانت روی عکس */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute bottom-0 right-0 w-full p-5 text-white sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs backdrop-blur-md">
            <BuildingStorefrontIcon className="h-4 w-4" />
            اطلاعات مزرعه
          </div>

          <h1 className="text-2xl font-black sm:text-4xl">{name}</h1>

          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        {/* آمار مزرعه */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="group flex items-center gap-4 rounded-2xl border border-green-100 bg-gradient-to-l from-green-50 to-white p-5 transition hover:border-green-200 hover:shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/20">
              <UserGroupIcon className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">ظرفیت مزرعه</p>

              <div className="mt-1 flex items-end gap-1">
                <strong className="text-2xl font-black text-gray-900">
                  {formatNumber(capacity)}
                </strong>

                <span className="mb-1 text-xs text-gray-500">نفر</span>
              </div>
            </div>
          </div>

          <div className="group flex items-center gap-4 rounded-2xl border border-amber-100 bg-gradient-to-l from-amber-50 to-white p-5 transition hover:border-amber-200 hover:shadow-sm">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <CurrencyDollarIcon className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">
                حداقل مبلغ خرید
              </p>

              <div className="mt-1 flex items-end gap-1">
                <strong className="text-2xl font-black text-gray-900">
                  {formatNumber(minPurchase)}
                </strong>

                <span className="mb-1 text-xs text-gray-500">تومان</span>
              </div>
            </div>
          </div>
        </div>

        {/* آدرس */}
        {address && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                <MapPinIcon className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-gray-900">آدرس مزرعه</h2>

                {address.street && (
                  <p className="mt-3 text-sm leading-7 text-gray-700">
                    {address.street}
                  </p>
                )}

                {fullAddress && (
                  <p className="mt-1 text-sm leading-7 text-gray-500">
                    {fullAddress}
                  </p>
                )}

                {address.postalCode && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <span className="text-xs text-gray-400">کد پستی</span>

                    <span
                      dir="ltr"
                      className="text-sm font-bold tracking-wider text-gray-700"
                    >
                      {address.postalCode}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* دکمه محصولات */}
        <div className="flex justify-end border-t border-gray-100 pt-6">
          <Link
            href={`/dashboard/farm/myFarms/${fermCode}/farmProducts`}
            className="w-full sm:w-auto"
          >
            <Button
              variant="success"
              className="flex w-full items-center justify-center gap-2 !rounded-xl px-7 py-3.5 shadow-lg shadow-green-600/15 sm:w-auto"
            >
              <ShoppingBagIcon className="h-5 w-5" />

              <span>مشاهده لیست محصولات</span>

              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FarmInfo;
