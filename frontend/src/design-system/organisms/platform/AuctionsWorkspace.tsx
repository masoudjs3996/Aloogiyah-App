"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClockIcon, BoltIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useAuctions } from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { platformApi } from "@/lib/actions/platform";
import {
  money,
  dateLabel,
  auctionState,
  hasManagerRole,
  hasRole,
  isoDate,
} from "@/shared/utils/platform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import StatusBadge from "@/design-system/atoms/platform/StatusBadge";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import QueryState from "@/design-system/molecules/platform/QueryState";
import Pagination from "@/design-system/molecules/platform/Pagination";
import ProductPicker from "@/design-system/molecules/platform/ProductPicker";
import { TextField } from "@/design-system/molecules/platform/FormField";
import toast from "react-hot-toast";
const startingStatus = process.env.NEXT_PUBLIC_AUCTION_OPEN_STATUS_CODE || "";
function useClock() {
  const [now, setNow] = useState<number>();
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
function AuctionForm({ done }: { done: () => void }) {
  const [product, setProduct] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [price, setPrice] = useState("");
  const mutation = usePlatformMutation(platformApi.createAuction, ["auctions"]);
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!startingStatus) return toast.error("ایجاد حراج فعلاً فعال نیست");
        if (new Date(end) <= new Date(start))
          return toast.error("پایان حراج باید بعد از شروع باشد");
        try {
          await mutation.mutateAsync({
            agriculturalProductCode: product,
            startDate: isoDate(start),
            endDate: isoDate(end),
            startingPrice: Number(price),
            statusCode: startingStatus,
          });
          done();
        } catch {}
      }}
    >
      <ProductPicker value={product} onChange={setProduct} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="زمان شروع"
          type="datetime-local"
          required
          dir="ltr"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <TextField
          label="زمان پایان"
          type="datetime-local"
          required
          dir="ltr"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <TextField
        label="قیمت پایه (تومان)"
        type="number"
        min="0.01"
        step="0.01"
        required
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      {!startingStatus && (
        <p className="text-sm text-amber-700">
          ایجاد حراج جدید فعلاً فعال نیست.
        </p>
      )}
      <ActionButton
        type="submit"
        busy={mutation.isPending}
        disabled={!product || !startingStatus}
      >
        ایجاد حراج
      </ActionButton>
    </form>
  );
}
export function AuctionDetail({ code }: { code: string }) {
  const query = useQuery({
    queryKey: ["platform", "auction", code],
    queryFn: () => platformApi.auction(code),
    refetchInterval: 10000,
  });
  const now = useClock();
  const [amount, setAmount] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const { roulData } = useUser();
  const manager = hasManagerRole(roulData?.data?.roleNames, roulData?.data?.roleName);
  const bid = usePlatformMutation(
    platformApi.bid,
    ["auction", "auctions"],
    "پیشنهاد شما ثبت شد",
  );
  const finalize = usePlatformMutation(platformApi.finalizeAuction, [
    "auction",
    "auctions",
  ]);
  const item = query.data;
  const current = Math.max(
    item?.startingPrice || 0,
    item?.currentPrice || 0,
    ...(item?.bids || []).map((b) => b.bidAmount),
  );
  const state =
    item && now
      ? auctionState(item.startDate, item.endDate, item.winnerCode, now)
      : "در حال بررسی زمان";
  const active = state === "در حال برگزاری";
  const seconds =
    item && now
      ? Math.max(0, Math.floor((new Date(item.endDate).getTime() - now) / 1000))
      : 0;
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/auctions"
        className="mb-6 inline-block text-sm text-emerald-700"
      >
        بازگشت به حراج‌ها
      </Link>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        skeleton="detail"
      >
        {item && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-3xl border border-slate-100 bg-white p-6">
              <div className="mb-5 flex justify-between">
                <h1 className="text-xl font-bold">حراج محصول</h1>
                <StatusBadge tone={active ? "green" : "neutral"}>
                  {state}
                </StatusBadge>
              </div>
              <div className="mb-6 flex h-40 items-center justify-center rounded-2xl bg-emerald-50">
                <BoltIcon className="h-20 w-20 text-emerald-300" />
              </div>
              <Link
                href={`/product/${encodeURIComponent(item.agriculturalProductCode)}`}
                className="text-sm font-bold text-emerald-700"
              >
                مشاهده مشخصات محصول ←
              </Link>
              <dl className="mt-6 grid gap-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">قیمت پایه</dt>
                  <dd>{money(item.startingPrice)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">شروع</dt>
                  <dd>{dateLabel(item.startDate)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">پایان</dt>
                  <dd>{dateLabel(item.endDate)}</dd>
                </div>
              </dl>
              <h2 className="mb-3 mt-8 font-bold">پیشنهادهای ثبت‌شده</h2>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {[...(item.bids || [])]
                  .sort((a, b) => b.bidAmount - a.bidAmount)
                  .map((b) => (
                    <div
                      key={b.code}
                      className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"
                    >
                      <strong>{money(b.bidAmount)}</strong>
                      <span className="text-xs text-slate-400">
                        {dateLabel(b.createdAt)}
                      </span>
                    </div>
                  ))}
                {!item.bids?.length && (
                  <p className="text-sm text-slate-500">
                    اولین پیشنهاد را شما بدهید.
                  </p>
                )}
              </div>
            </section>
            <aside className="h-fit rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">بالاترین قیمت فعلی</p>
              <p className="my-4 text-2xl font-bold text-emerald-800">
                {money(current)}
              </p>
              {active && (
                <p className="mb-6 flex items-center gap-2 text-sm text-amber-700">
                  <ClockIcon className="h-5 w-5" />
                  {Math.floor(seconds / 3600).toLocaleString("fa-IR")} ساعت و{" "}
                  {Math.floor((seconds % 3600) / 60).toLocaleString("fa-IR")}{" "}
                  دقیقه باقی‌مانده
                </p>
              )}
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (Number(amount) <= current)
                    return toast.error("مبلغ باید بیشتر از قیمت فعلی باشد");
                  setConfirm(true);
                }}
              >
                <TextField
                  label="پیشنهاد شما (تومان)"
                  type="number"
                  required
                  min={current + 0.01}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!active}
                />
                <ActionButton
                  type="submit"
                  className="w-full"
                  disabled={!active || query.isFetching}
                >
                  ثبت پیشنهاد
                </ActionButton>
              </form>
              {item.winnerCode && (
                <p className="mt-5 break-all rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  برنده حراج: {item.winnerCode}
                </p>
              )}
              {manager && state === "پایان یافته" && (
                <ActionButton
                  className="mt-4 w-full"
                  variant="secondary"
                  onClick={() => setFinalizeOpen(true)}
                >
                  نهایی‌کردن حراج
                </ActionButton>
              )}
            </aside>
          </div>
        )}
      </QueryState>
      <FormPanel
        open={confirm}
        onClose={() => setConfirm(false)}
        busy={bid.isPending}
        title="تأیید پیشنهاد"
      >
        <p className="mb-6 text-sm leading-7">
          پیشنهاد {money(Number(amount))} برای این حراج ثبت شود؟
        </p>
        <ActionButton
          busy={bid.isPending}
          onClick={async () => {
            try {
              await bid.mutateAsync({
                auctionCode: code,
                bidAmount: Number(amount),
              });
              setConfirm(false);
              setAmount("");
            } catch {
              setConfirm(false);
              query.refetch();
            }
          }}
        >
          تأیید و ثبت پیشنهاد
        </ActionButton>
      </FormPanel>
      <FormPanel
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        busy={finalize.isPending}
        title="نهایی‌کردن حراج"
      >
        <p className="mb-6 text-sm leading-7">
          برنده تعیین و موجودی محصول به‌روزرسانی شود؟
        </p>
        <ActionButton
          busy={finalize.isPending}
          onClick={async () => {
            try {
              await finalize.mutateAsync(code);
              setFinalizeOpen(false);
            } catch {}
          }}
        >
          تأیید نهایی
        </ActionButton>
      </FormPanel>
    </div>
  );
}
export default function AuctionsWorkspace() {
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState("");
  const [open, setOpen] = useState(false);
  const query = useAuctions({
    PageNumber: page,
    PageSize: 12,
    ProductCode: product || undefined,
  });
  const { roulData } = useUser();
  const role = roulData?.data?.roleName;
  const roles = roulData?.data?.roleNames;
  const now = useClock();
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title="حراج‌های الو گیاه"
        description="قیمت‌ها را مقایسه کنید و برای محصول موردنظر پیشنهاد بدهید."
        action={
          (hasManagerRole(roles, role) || hasRole(roles, "Farmer", role)) && (
            <ActionButton onClick={() => setOpen(true)}>
              <PlusIcon className="h-5 w-5" />
              ایجاد حراج
            </ActionButton>
          )
        }
      />
      <div className="mb-6 max-w-md">
        <TextField
          label="فیلتر با کد محصول"
          dir="ltr"
          value={product}
          onChange={(e) => {
            setProduct(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!query.data?.items.length}
        retry={() => query.refetch()}
        emptyText="حراجی برای نمایش وجود ندارد"
        skeleton="cards"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {query.data?.items.map((item) => (
            <Link
              key={item.code}
              href={`/dashboard/auctions/${encodeURIComponent(item.code)}`}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-5 flex items-center justify-between">
                <BoltIcon className="h-8 w-8 text-emerald-600" />
                <StatusBadge>
                  {now
                    ? auctionState(
                        item.startDate,
                        item.endDate,
                        item.winnerCode,
                        now,
                      )
                    : "حراج محصول"}
                </StatusBadge>
              </div>
              <h2 className="mb-2 font-bold text-slate-800">حراج محصول</h2>
              <p
                dir="ltr"
                className="mb-5 truncate text-right text-xs text-slate-400"
              >
                {item.agriculturalProductCode}
              </p>
              <p className="text-xs text-slate-500">بالاترین قیمت</p>
              <strong className="mt-2 block text-xl text-emerald-800">
                {money(item.currentPrice ?? item.startingPrice)}
              </strong>
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                پایان: {dateLabel(item.endDate)}
              </p>
              <span className="mt-4 block text-xs font-bold text-emerald-700">
                جزئیات و ثبت پیشنهاد ←
              </span>
            </Link>
          ))}
        </div>
      </QueryState>
      <Pagination
        page={page}
        total={query.data?.totalCount || 0}
        onChange={setPage}
        busy={query.isFetching}
      />
      <FormPanel
        open={open}
        onClose={() => setOpen(false)}
        title="ایجاد حراج محصول"
      >
        {open && <AuctionForm done={() => setOpen(false)} />}
      </FormPanel>
    </div>
  );
}
