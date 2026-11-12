"use client";
import { saleUnitLabel } from "@/shared/utils/sale-units";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { platformApi } from "@/lib/actions/platform";
import { money, dateLabel, hasRole, faNumber } from "@/shared/utils/platform";
import {
  orderStatuses,
  isStoppedOrder,
  orderStatusLabel,
  orderActionLabels,
  paymentLabels,
} from "@/shared/constants/order-statuses";
import ActionBar from "@/design-system/molecules/platform/ActionBar";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import OrderTimeline from "@/design-system/molecules/platform/OrderTimeline";
import StatusBadge from "@/design-system/atoms/platform/StatusBadge";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import QueryState from "@/design-system/molecules/platform/QueryState";
import {
  TextField,
  TextAreaField,
} from "@/design-system/molecules/platform/FormField";
import DeliveryPanel from "./DeliveryPanel";
export function OrderDetail({ code }: { code: string }) {
  const query = useQuery({
    queryKey: ["platform", "order", code],
    queryFn: () => platformApi.order(code),
    refetchInterval: 15000,
  });
  const profile = usePlatformProfile();
  const { roulData } = useUser();
  const [action, setAction] = useState<string>();
  const [reason, setReason] = useState("");
  const [shipping, setShipping] = useState("");
  const [tracking, setTracking] = useState("");
  const mutation = usePlatformMutation(
    (data: {
      action: string;
      reason?: string;
      shippingMethod?: string;
      trackingCode?: string;
    }) => platformApi.orderAction(code, data),
    ["order", "orders", "wallet", "checkout"],
  );

  const item = query.data;
  const userCode = profile.data?.user?.code;
  const customerActions = item?.allowedActions.filter(value =>
    ["Approve", "Reject", "Ship"].includes(value) && item.sellerCode === userCode
  ) ?? [];
  const confirmReason =
    action === "ConfirmDelivery" &&
    item?.buyerCode !== profile.data?.user?.code;
  return (
    <div className="mx-auto max-w-6xl px-1 sm:px-0">
      <Link
        href="/dashboard/orders"
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
      >
        <ArrowRightIcon className="h-4 w-4" />
        بازگشت به سفارش‌ها
      </Link>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
      >
        {item && (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="border-b border-emerald-100 bg-gradient-to-l from-emerald-100 via-emerald-50 to-white px-5 py-6 text-slate-900 sm:px-8 sm:py-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-700">
                      <BuildingStorefrontIcon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-emerald-700">جزئیات سفارش</p>
                      <h1 className="mt-1 truncate text-xl font-black sm:text-2xl">
                        {item.farmName}
                      </h1>
                    </div>
                  </div>
                <StatusBadge tone={isStoppedOrder(item.statusCode, item.statusTitle) ? "red" : item.isPaid ? "green" : "amber"}>
                  {orderStatusLabel(item.statusCode, item.statusTitle)}
                </StatusBadge>
              </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-white/90 ring-1 ring-emerald-100 px-3 py-1.5" dir="ltr">{item.code}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 ring-1 ring-emerald-100 px-3 py-1.5">
                    <CalendarDaysIcon className="h-4 w-4" />
                    {dateLabel(item.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 ring-1 ring-emerald-100 px-3 py-1.5">
                    <CreditCardIcon className="h-4 w-4" />
                    {paymentLabels[item.paymentStatus] || item.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0">
                  <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                    <ShoppingBagIcon className="h-5 w-5 text-emerald-700" />
                    اقلام سفارش
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {faNumber(item.orderItems.length)} قلم
                    </span>
                  </h2>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 px-4">
                    {item.orderItems.map((product) => (
                      <div
                        key={product.code}
                        className="grid min-w-0 gap-3 py-4"
                      >
                        <Link
                          href={`/product/${encodeURIComponent(product.agriculturalProductCode)}`}
                          className="min-w-0 break-words text-sm font-extrabold leading-6 text-slate-900 transition hover:text-emerald-700"
                        >
                          {product.productName}
                        </Link>
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span className="text-xs text-slate-500">
                            {faNumber(product.quantity)} {saleUnitLabel(product.saleUnit)} × {money(product.price)}
                          </span>
                          <strong className="text-sm text-slate-800">
                            {money(product.lineTotal)}
                          </strong>
                        </div>
                        <Link
                          href={`/dashboard/quality?product=${encodeURIComponent(product.agriculturalProductCode)}&order=${encodeURIComponent(item.code)}`}
                          className="w-fit max-w-full rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                        >
                          گزارش / درخواست کیفیت
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-fit rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                  <h2 className="mb-4 font-bold text-slate-800">خلاصه مبلغ</h2>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3 text-slate-500">
                      <dt>جمع کالاها</dt><dd>{money(item.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 text-slate-500">
                      <dt>ارسال</dt><dd>{money(item.shippingAmount)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 text-slate-500">
                      <dt>تخفیف</dt><dd>{money(item.discountAmount)}</dd>
                    </div>
                    {item.discountFundingSource && <div className="flex flex-wrap justify-between gap-3 text-sm text-slate-500"><dt>تأمین‌کننده تخفیف</dt><dd>{item.discountFundingSource === "Platform" ? "الو گیاه؛ بدون کسر از سهم کشاورز" : "کشاورز؛ کسر از سهم فروش"}</dd></div>}
                    <div className="flex items-end justify-between gap-3 rounded-xl bg-white p-3 text-base font-black text-emerald-800 ring-1 ring-emerald-100">
                      <dt>مبلغ نهایی</dt><dd>{money(item.totalPrice)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
            {item.address && (
              <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                  <MapPinIcon className="h-5 w-5 text-emerald-700" />
                  اطلاعات تحویل
                </h2>
                <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="mb-1 text-xs text-slate-500">تحویل‌گیرنده</p>
                    <p className="font-bold text-slate-800">{item.address.recipient}</p>
                    <p className="mt-1" dir="ltr">{item.address.phoneNumber}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="mb-1 text-xs text-slate-500">نشانی</p>
                    <p className="leading-7">{item.address.province}، {item.address.county}، {item.address.street}</p>
                    <p className="mt-1 text-xs text-slate-500">کد پستی: {item.address.postalCode}</p>
                  </div>
                </div>
                {item.trackingCode && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                    <TruckIcon className="h-5 w-5" />
                    کد رهگیری: <span dir="ltr">{item.trackingCode}</span>
                  </p>
                )}
              </section>
            )}
            {item.buyerCode === userCode && <DeliveryPanel checkoutCode={item.checkoutCode || undefined} />}
            {item.sellerCode === userCode && <p className="rounded-xl bg-amber-50 p-4 text-sm">هزینه حمل مزرعه تا میدان بار بر عهده کشاورز است. فقط تحویل ثبت‌شده با کد خریدار درآمد را آزاد می‌کند.</p>}
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 font-bold text-slate-800">پیگیری سفارش</h2>
              <div className="mb-5"><OrderTimeline order={item} /></div>
              {item.rejectionReason && (
                <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  دلیل رد: {item.rejectionReason}
                </p>
              )}
              {item.refundStatus !== "None" && (
                <p className="mb-4 text-sm text-slate-600">
                  وضعیت بازپرداخت: {item.refundStatus} /{" "}
                  {money(item.refundAmount)}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {customerActions
                  .map((value) => (
                    <ActionButton
                      key={value}
                      variant={value === "Reject" ? "danger" : "primary"}
                      onClick={() => {
                        setReason("");
                        setShipping("");
                        setTracking("");
                        setAction(value);
                      }}
                    >
                      {orderActionLabels[value] || value}
                    </ActionButton>
                  ))}
                {!item.isPaid &&
                  !item.isHeld &&
                  item.checkoutCode &&
                  item.statusCode === "3EFC703625" && (
                    <Link
                      href={`/dashboard/checkout/${encodeURIComponent(item.checkoutCode)}`}
                      className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
                    >
                      ادامه پرداخت
                    </Link>
                  )}

              </div>
              <div className="mt-6 space-y-3">
                {item.history?.map((history, index) => (
                  <div
                    key={`${history.createdAt}-${index}`}
                    className="border-r-2 border-emerald-200 pr-4"
                  >
                    <p className="text-sm text-slate-600">
                      {orderActionLabels[history.action] || history.action}{" "}
                      {history.reason && `— ${history.reason}`}
                    </p>
                    <span className="text-xs text-slate-400">
                      {dateLabel(history.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </QueryState>
      <FormPanel
        open={!!action}
        onClose={() => setAction(undefined)}
        busy={mutation.isPending}
        title={orderActionLabels[action || ""] || "عملیات سفارش"}
      >
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!action) return;
            try {
              await mutation.mutateAsync({
                action,
                reason: reason.trim() || undefined,
                shippingMethod: shipping.trim() || undefined,
                trackingCode: tracking.trim() || undefined,
              });
              setAction(undefined);
            } catch {}
          }}
        >
          <p className="text-sm leading-7 text-slate-500">
            این عملیات روی سفارش ثبت شود؟
          </p>
          {(action === "Reject" || confirmReason) && (
            <TextAreaField
              label={action === "Reject" ? "دلیل رد سفارش" : "توضیح"}
              required
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          {action === "Ship" && (
            <>
              <TextField
                label="روش ارسال"
                required
                maxLength={100}
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
              />
              <TextField
                label="کد رهگیری (اختیاری)"
                maxLength={100}
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
            </>
          )}
          <ActionBar><ActionButton type="submit" busy={mutation.isPending}>
            تأیید و ثبت
          </ActionButton></ActionBar>
        </form>
      </FormPanel>

    </div>
  );
}
export default function OrdersWorkspace() {
  const [view, setView] = useState("Buyer");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [status, setStatus] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const { roulData } = useUser();
  const role = roulData?.data?.roleName;
  const roles = roulData?.data?.roleNames;

  const query = useInfiniteQuery({
    queryKey: ["platform", "orders", "infinite", view, status],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => platformApi.orders({
      View: view,
      IncludeUnpaid: view === "Buyer",
      StatusCode: status || undefined,
      PageNumber: pageParam,
      PageSize: 12,
    }, signal),
    getNextPageParam: last => last.pageNumber * last.pageSize < last.totalCount ? last.pageNumber + 1 : undefined,
  });
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = query;
  const items = [...new Map(query.data?.pages.flatMap(page => page.items).map(item => [item.code, item]) || []).values()];
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isFetching || isFetchNextPageError) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void fetchNextPage();
    }, { rootMargin: "200px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title="سفارش‌ها"
        description="پرداخت، آماده‌سازی و تحویل سفارش‌های خود را دنبال کنید."
      />
      <nav
        aria-label="نوع سفارش"
        className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
      >
        {[
          { value: "Buyer", label: "خریدهای من" },
          ...(mounted && hasRole(roles, "Farmer", role)
            ? [{ value: "Seller", label: "فروش‌های مزارع من" }]
            : []),

        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={view === tab.value}
            onClick={() => {
              setView(tab.value);
            }}
            className={`shrink-0 rounded-xl px-4 py-3 text-xs font-bold transition sm:text-sm ${
              view === tab.value
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <nav
        aria-label="فیلتر وضعیت"
        className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-slate-50 p-2 pb-3"
      >
        {orderStatuses.map((tab) => (
          <button
            key={tab.code}
            type="button"
            aria-pressed={status === tab.code}
            onClick={() => {
              setStatus(tab.code);
            }}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${isStoppedOrder(tab.code) ? status === tab.code ? "bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100" : "text-red-600 hover:bg-red-50" : status === tab.code ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <QueryState
        loading={query.isLoading}
        error={!query.data ? query.error : undefined}
        empty={!items.length}
        retry={() => query.refetch()}
        emptyText="سفارشی در این بخش ثبت نشده است"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.code}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-700" />
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
                      <BuildingStorefrontIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-slate-900">{item.farmName}</h2>
                      <p className="mt-1 text-xs text-slate-400">
                        {faNumber(item.orderItems.length)} قلم کالا
                      </p>
                    </div>
                  </div>
                  <StatusBadge tone={isStoppedOrder(item.statusCode, item.statusTitle) ? "red" : item.isPaid ? "green" : "amber"}>
                    {orderStatusLabel(item.statusCode, item.statusTitle)}
                  </StatusBadge>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="line-clamp-2 break-words text-sm font-bold leading-6 text-slate-900">
                    {item.orderItems.map((product) => product.productName).join("، ")}
                  </p>
                </div>
                <div className="mt-4"><OrderTimeline order={item} /></div>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="mb-1 text-[11px] text-slate-400">مبلغ سفارش</p>
                    <strong className="text-base font-black text-emerald-800">
                      {money(item.totalPrice)}
                    </strong>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="hidden text-left sm:block">
                      <p className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                        {dateLabel(item.createdAt)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {paymentLabels[item.paymentStatus] || item.paymentStatus}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/orders/${encodeURIComponent(item.code)}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-800"
                    >
                      جزئیات سفارش
                      <span aria-hidden="true">←</span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
      <div ref={sentinel} className="h-1" aria-hidden="true" />
      {query.isFetchingNextPage && <p role="status" className="py-4 text-center text-sm text-slate-500">در حال بارگذاری سفارش‌های بیشتر…</p>}
      {query.isFetchNextPageError && <QueryState error={query.error} retry={() => query.fetchNextPage()} />}
    </div>
  );
}
