"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { useOrders, usePlatformProfile } from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { platformApi } from "@/lib/actions/platform";
import { money, dateLabel, hasManagerRole, hasRole, faNumber } from "@/shared/utils/platform";
import {
  orderStatuses,
  orderActionLabels,
  paymentLabels,
} from "@/shared/constants/order-statuses";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import StatusBadge from "@/design-system/atoms/platform/StatusBadge";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import QueryState from "@/design-system/molecules/platform/QueryState";
import Pagination from "@/design-system/molecules/platform/Pagination";
import {
  TextField,
  TextAreaField,
} from "@/design-system/molecules/platform/FormField";
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
  const [reference, setReference] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const mutation = usePlatformMutation(
    (data: {
      action: string;
      reason?: string;
      shippingMethod?: string;
      trackingCode?: string;
    }) => platformApi.orderAction(code, data),
    ["order", "orders", "wallet", "checkout"],
  );
  const refund = usePlatformMutation(
    (value: string) => platformApi.completeRefund(code, value),
    ["order", "orders"],
  );
  const item = query.data;
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
              <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-700 px-5 py-6 text-white sm:px-8 sm:py-8">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                      <BuildingStorefrontIcon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-emerald-100">جزئیات سفارش</p>
                      <h1 className="mt-1 truncate text-xl font-black sm:text-2xl">
                        {item.farmName}
                      </h1>
                    </div>
                  </div>
                <StatusBadge tone={item.isPaid ? "green" : "amber"}>
                  {item.statusTitle ||
                    orderStatuses.find((s) => s.code === item.statusCode)
                      ?.label ||
                    item.statusCode}
                </StatusBadge>
              </div>
                <div className="flex flex-wrap gap-2 text-xs text-emerald-50">
                  <span className="rounded-full bg-white/10 px-3 py-1.5" dir="ltr">{item.code}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                    <CalendarDaysIcon className="h-4 w-4" />
                    {dateLabel(item.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
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
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {faNumber(item.orderItems.length)} قلم
                    </span>
                  </h2>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 px-4">
                    {item.orderItems.map((product) => (
                      <div
                        key={product.code}
                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                      >
                        <Link
                          href={`/product/${encodeURIComponent(product.agriculturalProductCode)}`}
                          className="min-w-0 flex-1 text-sm font-bold text-slate-800 transition hover:text-emerald-700"
                        >
                          {product.productName}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {faNumber(product.quantity)} × {money(product.price)}
                        </span>
                        <strong className="text-sm text-slate-800">
                          {money(product.lineTotal)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-fit rounded-2xl bg-slate-50 p-4 sm:p-5">
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
                    <div className="flex items-end justify-between gap-3 border-t border-slate-200 pt-4 text-base font-black text-emerald-800">
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
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="mb-1 text-xs text-slate-400">تحویل‌گیرنده</p>
                    <p className="font-bold text-slate-800">{item.address.recipient}</p>
                    <p className="mt-1" dir="ltr">{item.address.phoneNumber}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="mb-1 text-xs text-slate-400">نشانی</p>
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
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 font-bold text-slate-800">پیگیری سفارش</h2>
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
                {item.allowedActions
                  .filter((value) => value !== "CompleteRefund")
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
                {hasManagerRole(roulData?.data?.roleNames, roulData?.data?.roleName) &&
                  item.refundStatus === "Pending" && (
                    <ActionButton
                      variant="secondary"
                      onClick={() => setRefundOpen(true)}
                    >
                      تأیید بازپرداخت
                    </ActionButton>
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
              label="توضیح"
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
          <ActionButton type="submit" busy={mutation.isPending}>
            تأیید و ثبت
          </ActionButton>
        </form>
      </FormPanel>
      <FormPanel
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        busy={refund.isPending}
        title="تأیید بازپرداخت"
      >
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await refund.mutateAsync(reference.trim());
              setRefundOpen(false);
            } catch {}
          }}
        >
          <TextField
            label="شناسه مرجع بازپرداخت"
            required
            minLength={3}
            maxLength={150}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <ActionButton type="submit" busy={refund.isPending}>
            تأیید بازپرداخت
          </ActionButton>
        </form>
      </FormPanel>
    </div>
  );
}
export default function OrdersWorkspace() {
  const [view, setView] = useState("Buyer");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { roulData } = useUser();
  const role = roulData?.data?.roleName;
  const roles = roulData?.data?.roleNames;
  const manager = hasManagerRole(roles, role);
  const query = useOrders({
    View: view,
    IncludeUnpaid: view === "Buyer",
    StatusCode: status || undefined,
    PageNumber: page,
    PageSize: 12,
  });
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
          ...((hasRole(roles, "Farmer", role) || manager)
            ? [{ value: "Seller", label: "فروش‌های مزارع من" }]
            : []),
          ...(manager ? [{ value: "Manager", label: "همه سفارش‌ها" }] : []),
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={view === tab.value}
            onClick={() => {
              setView(tab.value);
              setPage(1);
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
              setPage(1);
            }}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${status === tab.code ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100" : "text-slate-500 hover:bg-white hover:text-slate-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!query.data?.items.length}
        retry={() => query.refetch()}
        emptyText="سفارشی در این بخش ثبت نشده است"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data?.items.map((item) => (
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
                  <StatusBadge tone={item.isPaid ? "green" : "amber"}>
                    {item.statusTitle ||
                      orderStatuses.find((s) => s.code === item.statusCode)
                        ?.label ||
                      item.statusCode}
                  </StatusBadge>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="line-clamp-2 text-xs leading-6 text-slate-600">
                    {item.orderItems.map((product) => product.productName).join("، ")}
                  </p>
                </div>
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
      <Pagination
        page={page}
        total={query.data?.totalCount || 0}
        onChange={setPage}
        busy={query.isFetching}
      />
    </div>
  );
}
