"use client";
import { useState } from "react";
import {
  UsersRound,
  ShoppingBag,
  Wallet,
  TicketPercent,
  Store,
  Search,
  History,
  MessageCircle,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  X,
  Info,
  CircleSlash,
} from "lucide-react";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { formControlClass } from "@/design-system/atoms/formControlStyles";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, errorMessage } from "@/lib/actions/platform";
import { useSellerAccess } from "@/shared/hooks/useSellerAccess";
import QueryState from "@/design-system/molecules/platform/QueryState";
import ChatRoomLink from "@/design-system/molecules/platform/ChatRoomLink";
import SellerDiscountDialog, {
  salesMoney as money,
  salesDate as date,
} from "./SellerDiscountDialog";
import type { Page } from "@/shared/types/platform";
import type {
  SellerCustomer,
  SellerCustomerOrder,
  SellerDiscount,
  SellerSalesSummary,
} from "@/shared/types/seller-sales";

const buttonBase = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40";
const button = `${buttonBase} border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700`;
const accentButton = `${buttonBase} border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;
const panel =
  "rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6";
function Pages({
  page,
  total,
  change,
}: {
  page: number;
  total: number;
  change: (page: number) => void;
}) {
  if (total <= 20 && page === 1) return null;
  return (
    <nav
      aria-label="صفحه‌بندی"
      className="flex items-center justify-center gap-3 border-t border-slate-100 pt-4"
    >
      <button
        type="button"
        className={button}
        disabled={page <= 1}
        onClick={() => change(page - 1)}
      >
        <ArrowRight className="h-4 w-4" />
        قبلی
      </button>
      <span className="text-xs text-slate-500">
        صفحه {page.toLocaleString("fa-IR")} از{" "}
        {Math.max(1, Math.ceil(total / 20)).toLocaleString("fa-IR")}
      </span>
      <button
        type="button"
        className={button}
        disabled={page * 20 >= total}
        onClick={() => change(page + 1)}
      >
        بعدی
        <ArrowLeft className="h-4 w-4" />
      </button>
    </nav>
  );
}
export default function SellerSalesWorkspace() {
  const access = useSellerAccess();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [discountPage, setDiscountPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [selected, setSelected] = useState<SellerCustomer | null>(null);
  const [couponCustomer, setCouponCustomer] = useState<SellerCustomer | null>(
    null,
  );
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const summary = useQuery({
    queryKey: ["seller-sales", "summary"],
    queryFn: () => request<SellerSalesSummary>("/SellerSales/Summary"),
    enabled: access.allowed,
  });
  const customers = useQuery({
    queryKey: ["seller-sales", "customers", term, page],
    queryFn: () =>
      request<Page<SellerCustomer>>("/SellerSales/Customers", {
        params: { search: term, page },
      }),
    enabled: access.allowed,
  });
  const discounts = useQuery({
    queryKey: ["seller-sales", "discounts", discountPage],
    queryFn: () =>
      request<Page<SellerDiscount>>("/SellerSales/Discounts", {
        params: { page: discountPage },
      }),
    enabled: access.allowed,
  });
  const history = useQuery({
    queryKey: ["seller-sales", "orders", selected?.code, historyPage],
    queryFn: () =>
      request<Page<SellerCustomerOrder>>(
        `/SellerSales/Customers/${encodeURIComponent(selected!.code)}/Orders`,
        { params: { page: historyPage } },
      ),
    enabled: access.allowed && !!selected,
  });
  async function disable(code: string) {
    if (busy) return;
    setBusy(code);
    setError("");
    try {
      await request(
        `/SellerSales/Discounts/${encodeURIComponent(code)}/Disable`,
        { method: "POST" },
      );
      await client.invalidateQueries({ queryKey: ["seller-sales"] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  }
  if (access.loading) return <QueryState loading />;
  if (!access.allowed)
    return (
      <section className={`${panel} mx-auto max-w-6xl`}>
        <h1 className="text-xl font-bold text-slate-800">
          مدیریت مشتریان و فروش
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          این بخش برای حساب کشاورز فعال است.
        </p>
        {access.error && (
          <p role="alert" className="mt-3 text-sm text-rose-600">
            {errorMessage(access.error)}
          </p>
        )}
        <Link
          href="/dashboard/business?type=Farmer"
          className={`${button} mt-4`}
        >
          درخواست همکاری کشاورز
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </section>
    );
  const statistics = summary.data
    ? [
        {
          label: "مشتری",
          value: summary.data.customerCount.toLocaleString("fa-IR"),
          Icon: UsersRound,
          tone: "bg-sky-50 text-sky-600",
        },
        {
          label: "سفارش ثبت‌شده",
          value: summary.data.orderCount.toLocaleString("fa-IR"),
          Icon: ShoppingBag,
          tone: "bg-violet-50 text-violet-600",
        },
        {
          label: "خرید پرداخت‌شدهٔ تأییدشده",
          value: money(summary.data.purchasedAmount),
          Icon: Wallet,
          tone: "bg-emerald-50 text-emerald-600",
        },
        {
          label: "کد تخفیف فعال",
          value: summary.data.activeDiscounts.toLocaleString("fa-IR"),
          Icon: TicketPercent,
          tone: "bg-amber-50 text-amber-600",
        },
      ]
    : [];
  return (
    <section className="mx-auto max-w-6xl space-y-6 text-slate-700" dir="rtl">
      <header className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-emerald-700"
            >
              الو گیاه / داشبورد
            </Link>
            <h1 className="mt-3 text-xl font-black text-slate-900 sm:text-2xl">
              مشتریان و فروش من
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              مشتری‌هایت را بشناس، سابقهٔ خریدشان را ببین و برای خرید بعدی،
              تخفیف اختصاصی بساز.
            </p>
          </div>
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm sm:flex">
            <Store className="h-7 w-7" strokeWidth={1.6} />
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className={button} href="/dashboard/orders">
            <ShoppingBag className="h-4 w-4" />
            مدیریت سفارش‌ها
          </Link>
          <Link className={button} href="/dashboard/profile/settlements">
            <Wallet className="h-4 w-4" />
            حساب مالی و تسویه
          </Link>
        </div>
      </header>
      <QueryState
        loading={summary.isLoading}
        error={summary.error}
        retry={() => void summary.refetch()}
      >
        {summary.data && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {statistics.map(({ label, value, Icon, tone }) => (
              <article
                key={label}
                className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <span
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <p className="text-[11px] leading-6 text-slate-500 sm:text-xs">
                  {label}
                </p>
                <p className="mt-2 break-words text-base font-black leading-8 text-slate-800 sm:text-lg">
                  {value}
                </p>
              </article>
            ))}
          </div>
        )}
      </QueryState>
      <p className="px-1 text-xs leading-7 text-slate-500">
        مشتری‌ها از سفارش‌های ثبت‌شدهٔ مزارع شما استخراج می‌شوند. مبلغ خرید،
        پرداخت خریدار برای سفارش‌های پرداخت‌شده و تأییدشده است و با درآمد قابل
        تسویه تفاوت دارد.
      </p>
      <section
        aria-labelledby="sales-customers-title"
        className={`${panel} space-y-5`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <UsersRound className="h-5 w-5" />
          </span>
          <h2
            id="sales-customers-title"
            className="text-base font-bold text-slate-800 sm:text-lg"
          >
            مشتریان من
          </h2>
          {customers.data && (
            <span className="mr-auto rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">
              {customers.data.totalCount.toLocaleString("fa-IR")} مشتری
            </span>
          )}
        </div>
        <form
          className="flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(search.trim());
            setPage(1);
          }}
        >
          <label className="relative min-w-[160px] flex-1">
            <span className="sr-only">نام مشتری</span>
            <Search className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجوی نام مشتری"
              className={`${formControlClass} pr-10`}
            />
          </label>
          <ActionButton type="submit">
            <Search className="h-4 w-4" />
            جست‌وجو
          </ActionButton>
        </form>
        <QueryState
          loading={customers.isLoading}
          error={customers.error}
          retry={() => void customers.refetch()}
          empty={customers.data?.items.length === 0}
          emptyText={
            term
              ? "مشتری با این نام پیدا نشد."
              : "هنوز سفارشی از مشتری‌ها ثبت نشده؛ از داخل چت می‌توانی برای مخاطبت کد اختصاصی بسازی."
          }
        >
          <div className="sales-customers-grid">
            {customers.data?.items.map((c) => (
              <article
                key={c.code}
                className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-emerald-200 sm:p-5"
              >
                <div className="mb-4 grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    <UsersRound className="h-5 w-5" />
                  </span>
                  <h3 className="min-w-0 [overflow-wrap:anywhere] text-sm font-bold leading-7 text-slate-800">
                    {c.name}
                  </h3>
                  <span className="col-start-2 w-fit rounded-full bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                    {c.orderCount.toLocaleString("fa-IR")} سفارش
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-3">
                  <span className="text-xs text-slate-500">خرید تأییدشده</span>
                  <span className="text-sm font-bold text-slate-800">
                    {money(c.purchasedAmount)}
                  </span>
                </div>
                <p className="my-4 flex items-start gap-2 text-[11px] leading-6 text-slate-400">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                  آخرین سفارش: {date(c.lastOrderAt)}
                </p>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    className={button}
                    onClick={() => {
                      setSelected(c);
                      setHistoryPage(1);
                    }}
                  >
                    <History className="h-4 w-4" />
                    سابقه خرید
                  </button>
                  <button
                    type="button"
                    className={accentButton}
                    onClick={() => setCouponCustomer(c)}
                  >
                    <TicketPercent className="h-4 w-4" />
                    ساخت کد تخفیف
                  </button>
                  <ChatRoomLink receiverCode={c.code} className={button}>
                    <MessageCircle className="h-4 w-4" />
                    گفت‌وگو
                  </ChatRoomLink>
                </div>
              </article>
            ))}
          </div>
        </QueryState>
        <Pages
          page={page}
          total={customers.data?.totalCount || 0}
          change={setPage}
        />
      </section>
      {selected && (
        <section
          aria-label={`سابقه خرید ${selected.name}`}
          className={`${panel} space-y-4`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
              <History className="h-5 w-5 text-sky-600" />
              سابقه خرید {selected.name}
            </h2>
            <button
              type="button"
              className={button}
              onClick={() => setSelected(null)}
            >
              <X className="h-4 w-4" />
              بستن سابقه
            </button>
          </div>
          <QueryState
            loading={history.isLoading}
            error={history.error}
            retry={() => void history.refetch()}
            empty={history.data?.items.length === 0}
          >
            {history.data?.items.map((o) => (
              <article
                key={o.code}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm leading-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-slate-800">
                    سفارش <span dir="ltr">{o.code}</span> · {o.farmName}
                  </p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                    {o.status}
                  </span>
                </div>
                <p className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">
                    {money(o.totalPrice)}
                  </span>
                  <span>{date(o.createdAt)}</span>
                </p>
              </article>
            ))}
          </QueryState>
          <Pages
            page={historyPage}
            total={history.data?.totalCount || 0}
            change={setHistoryPage}
          />
        </section>
      )}
      <section
        aria-labelledby="sales-discounts-title"
        className={`${panel} space-y-5`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TicketPercent className="h-5 w-5" />
          </span>
          <h2
            id="sales-discounts-title"
            className="text-base font-bold text-slate-800 sm:text-lg"
          >
            کدهای تخفیف من
          </h2>
          {discounts.data && (
            <span className="mr-auto rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">
              {discounts.data.totalCount.toLocaleString("fa-IR")} کد
            </span>
          )}
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
          <Info className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-7 text-amber-800">
            هزینهٔ کدهایی که خودت می‌سازی از سهم فروشت کم می‌شود. تخفیف‌های
            صادرشده توسط الو گیاه را پلتفرم تأمین می‌کند و سهم تو بابت آن تخفیف
            کاهش نمی‌یابد.
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-600"
          >
            {error}
          </p>
        )}
        <QueryState
          loading={discounts.isLoading}
          error={discounts.error}
          retry={() => void discounts.refetch()}
          empty={discounts.data?.items.length === 0}
          emptyText="هنوز کدی نساخته‌ای؛ از کارت مشتری یا داخل چت شروع کن."
        >
          <div className="sales-customers-grid">
            {discounts.data?.items.map((d) => {
              const active =
                d.isActive &&
                (!d.endDate || new Date(d.endDate).getTime() > Date.now()) &&
                (d.maxUsage == null || d.usageCount < d.maxUsage);
              return (
                <article
                  key={d.code}
                  className="min-w-0 space-y-4 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code
                      className="select-text rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold tracking-wider text-slate-800"
                      dir="ltr"
                    >
                      {d.code}
                    </code>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`}
                      />
                      {active
                        ? "فعال"
                        : !d.isActive
                          ? "غیرفعال"
                          : d.endDate &&
                              new Date(d.endDate).getTime() <= Date.now()
                            ? "منقضی‌شده"
                            : "مصرف‌شده"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-700">
                      {d.discountType === 0 || d.discountType === "Percentage"
                        ? `${d.value.toLocaleString("fa-IR")}٪`
                        : money(d.value)}{" "}
                      تخفیف
                    </h3>
                      {!!d.maxDiscountAmount && (
                      <p className="mt-1 text-xs text-slate-500">
                        تا سقف {money(d.maxDiscountAmount)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 text-xs leading-6 text-slate-500">
                    <p className="flex items-start gap-2">
                      <UsersRound className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {d.customerName} · {d.farmName}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <ShoppingBag className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        {d.productCodes.length
                          ? `${d.productCodes.length.toLocaleString("fa-IR")} محصول منتخب`
                          : "همهٔ محصولات این مزرعه"}
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                      <span>اعتبار تا {date(d.endDate)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                    <span>
                      استفاده: {d.usageCount.toLocaleString("fa-IR")} از{" "}
                      {d.maxUsage?.toLocaleString("fa-IR") || "نامحدود"}
                    </span>
                    <span>هزینه بر عهدهٔ شما</span>
                  </div>
                  {active && (
                    <ActionButton
                      variant="danger"
                      busy={busy === d.code}
                      disabled={!!busy}
                      onClick={() => void disable(d.code)}
                      className="w-full !text-xs"
                    >
                      <CircleSlash className="h-4 w-4" />
                      غیرفعال‌کردن کد
                    </ActionButton>
                  )}
                </article>
              );
            })}
          </div>
        </QueryState>
        <Pages
          page={discountPage}
          total={discounts.data?.totalCount || 0}
          change={setDiscountPage}
        />
      </section>
      {couponCustomer && (
        <SellerDiscountDialog
          key={couponCustomer.code}
          customerCode={couponCustomer.code}
          customerName={couponCustomer.name}
          onClose={() => setCouponCustomer(null)}
        />
      )}
    </section>
  );
}
