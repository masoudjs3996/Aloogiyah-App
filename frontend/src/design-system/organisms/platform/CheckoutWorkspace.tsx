"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { platformApi } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { money, dateLabel } from "@/shared/utils/platform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import QueryState from "@/design-system/molecules/platform/QueryState";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import {
  SelectField,
  TextField,
} from "@/design-system/molecules/platform/FormField";
import { AddressForm } from "./AddressesWorkspace";
import toast from "react-hot-toast";
import { checkoutAttemptStorageKey, checkoutFingerprint, clearCheckoutAttempt } from "@/shared/utils/checkoutAttempt";
export default function CheckoutWorkspace({ code }: { code?: string }) {
  const router = useRouter();
  const [addressCode, setAddress] = useState("");
  const [discountCode, setDiscount] = useState("");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [now, setNow] = useState(0);
  const cart = useQuery({
    queryKey: ["platform", "cart"],
    queryFn: platformApi.cart,
    enabled: !code,
  });
  const addresses = useQuery({
    queryKey: ["platform", "addresses", "checkout"],
    queryFn: () => platformApi.addresses({ PageSize: 100 }),
    enabled: !code,
  });
  const checkout = useQuery({
    queryKey: ["platform", "checkout", code],
    queryFn: () => platformApi.checkout(code!),
    enabled: !!code,
    refetchInterval: 15000,
  });
  const create = usePlatformMutation(platformApi.createCheckout, ["checkout"]);
  const pay = usePlatformMutation(
    platformApi.payWallet,
    ["checkout", "orders", "cart", "wallet"],
    "وجه رزرو شد؛ سفارش در انتظار تأیید فروشنده است",
  );
  const cancel = usePlatformMutation(platformApi.cancelCheckout, [
    "checkout",
    "cart",
    "orders",
  ]);
  // کلید هر تلاش تا تعیین نتیجه حفظ می‌شود؛ retry سفارش تکراری ایجاد نمی‌کند.
  const attempt = useRef<{ fingerprint: string; key: string; checkoutCode?: string } | undefined>(
    undefined,
  );
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!addressCode && addresses.data?.items.length)
      setAddress(
        (
          addresses.data.items.find((a) => a.isDefault) ||
          addresses.data.items[0]
        ).code,
      );
  }, [addresses.data, addressCode]);
  const item = checkout.data;
  const expired =
    item &&
    (item.isExpired || (now > 0 && now >= new Date(item.expiresAt).getTime()));
  useEffect(() => {
    if (item && (item.isSubmitted || item.isPaid || expired)) {
      clearCheckoutAttempt(item.code);
    }
  }, [item, expired]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        title={code ? "بررسی و پرداخت خرید" : "انتخاب آدرس و ثبت خرید"}
        description="مبلغ نهایی از سرور دریافت می‌شود. وجه تا تأیید فروشنده در کیف پول رزرو می‌شود."
      />
      {!code ? (
        <QueryState
          loading={cart.isLoading || addresses.isLoading}
          error={cart.error || addresses.error}
          retry={() => {
            cart.refetch();
            addresses.refetch();
          }}
        >
          <form
            className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!cart.data?.cartId || !cart.data.farms.length)
                return toast.error("سبد خرید خالی است");
              const fingerprint = checkoutFingerprint(cart.data, addressCode, discountCode);
              const storageKey = checkoutAttemptStorageKey(cart.data.cartId);
              if (
                !attempt.current ||
                attempt.current.fingerprint !== fingerprint
              ) {
                try {
                  const saved = JSON.parse(
                    sessionStorage.getItem(storageKey) || "null",
                  );
                  attempt.current =
                    saved?.fingerprint === fingerprint && typeof saved.key === "string" && saved.key.length >= 8
                      ? saved
                      : { fingerprint, key: crypto.randomUUID() };
                  sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(attempt.current),
                  );
                } catch {
                  attempt.current = { fingerprint, key: crypto.randomUUID() };
                }
              }
              try {
                const result = await create.mutateAsync({
                  cartId: cart.data.cartId,
                  addressCode,
                  discountCode: discountCode.trim() || undefined,
                  idempotencyKey: attempt.current!.key,
                });
                attempt.current!.checkoutCode = result.code;
                try {
                  sessionStorage.setItem(storageKey, JSON.stringify(attempt.current));
                } catch { /* Browser storage is optional. */ }
                if (result.isExpired || result.isSubmitted || result.isPaid || Date.now() >= new Date(result.expiresAt).getTime()) {
                  clearCheckoutAttempt(result.code);
                  attempt.current = undefined;
                  return toast.error("خرید قبلی پایان یافته است؛ دوباره ثبت خرید را بزنید");
                }
                router.push(
                  `/dashboard/checkout/${encodeURIComponent(result.code)}`,
                );
              } catch {}
            }}
          >
            <SelectField
              label="آدرس ارسال"
              required
              value={addressCode}
              onChange={(e) => setAddress(e.target.value)}
            >
              <option value="">انتخاب آدرس</option>
              {addresses.data?.items.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.provinceName}، {a.countyName}، {a.street}
                </option>
              ))}
            </SelectField>
            <ActionButton variant="secondary" onClick={() => setOpen(true)}>
              افزودن آدرس جدید
            </ActionButton>
            <TextField
              label="کد تخفیف (اختیاری)"
              dir="ltr"
              value={discountCode}
              onChange={(e) => setDiscount(e.target.value)}
            />
            <div className="flex justify-between rounded-xl bg-emerald-50 p-4 text-sm">
              <span>جمع کالاهای سبد</span>
              <strong>{money(cart.data?.totalPrice)}</strong>
            </div>
            <ActionButton
              type="submit"
              busy={create.isPending}
              disabled={!addressCode || !cart.data?.farms.length}
            >
              ثبت خرید و مشاهده مبلغ نهایی
            </ActionButton>
          </form>
        </QueryState>
      ) : (
        <QueryState
          loading={checkout.isLoading}
          error={checkout.error}
          retry={() => checkout.refetch()}
        >
          {item && (
            <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6">
              <p className="text-sm text-slate-500">
                شناسه خرید: <span dir="ltr">{item.code}</span>
              </p>
              <div className="rounded-2xl bg-emerald-50 p-5">
                <p className="text-sm text-emerald-700">مبلغ قابل پرداخت</p>
                <p className="mt-3 text-3xl font-bold text-emerald-800">
                  {money(item.payableAmount)}
                </p>
              </div>
              {item.orders.map((order) => (
                <div
                  key={order.code}
                  className="flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-3"
                >
                  <span className="text-sm">{order.farmName}</span>
                  <span className="text-sm">{money(order.totalPrice)}</span>
                </div>
              ))}
              {item.isSubmitted || item.isPaid ? (
                <div className="rounded-xl bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
                  درخواست خرید ثبت شده است. وجه سفارش‌های در انتظار تأیید، رزرو است و پس از تأیید فروشنده برداشت می‌شود؛ در صورت رد، رزرو آزاد می‌شود. وضعیت هر مزرعه را در
                  سفارش‌ها پیگیری کنید.
                  <Link
                    href="/dashboard/orders"
                    className="mt-4 block font-bold"
                  >
                    مشاهده سفارش‌ها ←
                  </Link>
                </div>
              ) : expired ? (
                <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-800">
                  مهلت پرداخت این خرید تمام شده است.
                  <Link href="/checkout/card" className="mt-3 block font-bold">
                    بازگشت به سبد خرید
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    مهلت پرداخت: {dateLabel(item.expiresAt)}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <ActionButton
                      busy={pay.isPending}
                      onClick={() => setPayOpen(true)}
                    >
                      پرداخت با کیف پول
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => setCancelOpen(true)}
                    >
                      لغو این خرید
                    </ActionButton>
                  </div>
                  <Link
                    href="/dashboard/profile/wallet"
                    className="block text-xs text-emerald-700"
                  >
                    مشاهده کیف پول
                  </Link>
                </>
              )}
            </div>
          )}
        </QueryState>
      )}
      <FormPanel open={open} onClose={() => setOpen(false)} title="ثبت آدرس">
        <AddressForm done={() => setOpen(false)} />
      </FormPanel>
      <FormPanel
        open={payOpen}
        onClose={() => setPayOpen(false)}
        busy={pay.isPending}
        title="تأیید رزرو وجه"
      >
        <p className="mb-6 text-sm leading-7">
          مبلغ {money(item?.payableAmount)} در کیف پول رزرو شود؟ پس از تأیید فروشنده، مبلغ سفارش او برداشت می‌شود و در صورت رد سفارش، رزرو آن آزاد می‌شود.
        </p>
        <ActionButton
          busy={pay.isPending}
          onClick={async () => {
            if (!code) return;
            try {
              await pay.mutateAsync(code);
              setPayOpen(false);
            } catch {}
          }}
        >
          تأیید رزرو وجه
        </ActionButton>
      </FormPanel>
      <FormPanel
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        busy={cancel.isPending}
        title="لغو خرید"
      >
        <p className="mb-6 text-sm">این خرید در انتظار پرداخت لغو شود؟</p>
        <ActionButton
          variant="danger"
          busy={cancel.isPending}
          onClick={async () => {
            if (!code) return;
            try {
              await cancel.mutateAsync(code);
              setCancelOpen(false);
            } catch {}
          }}
        >
          تأیید لغو
        </ActionButton>
      </FormPanel>
    </div>
  );
}
