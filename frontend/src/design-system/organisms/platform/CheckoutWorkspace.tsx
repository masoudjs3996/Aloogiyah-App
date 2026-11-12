"use client";
import { saleUnitLabel } from "@/shared/utils/sale-units";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { platformApi } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { money, dateLabel } from "@/shared/utils/platform";
import ActionBar from "@/design-system/molecules/platform/ActionBar";
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
import type { CheckoutDiscountPreview } from "@/shared/types/platform";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  checkoutAttemptStorageKey,
  checkoutFingerprint,
  clearCheckoutAttempt,
} from "@/shared/utils/checkoutAttempt";
import DeliveryChoice from "./DeliveryChoice";
import DeliveryPanel from "./DeliveryPanel";
import type { DeliverySelection } from "@/shared/types/delivery";
export default function CheckoutWorkspace({ code }: { code?: string }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState<DeliverySelection>();
  const [addressCode, setAddress] = useState("");
  const [discountCode, setDiscount] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    fingerprint: string;
    result: CheckoutDiscountPreview;
  }>();
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
  const discountPreview = usePlatformMutation(
    platformApi.previewCheckoutDiscount,
    [],
    "کد تخفیف اعمال شد",
  );
  const discountFingerprint = cart.data
    ? checkoutFingerprint(cart.data, "", discountCode)
    : "";
  const validDiscount =
    appliedDiscount?.fingerprint === discountFingerprint &&
    appliedDiscount.result.discountCode === discountCode.trim()
      ? appliedDiscount.result
      : undefined;
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
  const attempt = useRef<
    { fingerprint: string; key: string; checkoutCode?: string } | undefined
  >(undefined);
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
  const deliveryAddress = addresses.data?.items.find(a => a.code === addressCode);
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
        description="وجه تا تأیید فروشنده در کیف پول رزرو می‌شود."
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
              if (discountCode.trim() && !validDiscount)
                return toast.error("ابتدا کد تخفیف را اعمال کنید.");
              if (!delivery || delivery.fingerprint !== checkoutFingerprint(cart.data, addressCode, "")) return toast.error("روش دریافت و هزینه ارسال را تأیید کنید.");
              const fingerprint = delivery.code + checkoutFingerprint(
                cart.data,
                addressCode,
                validDiscount?.discountCode || "",
              );
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
                    saved?.fingerprint === fingerprint &&
                    typeof saved.key === "string" &&
                    saved.key.length >= 8
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
                  deliveryBookingCode: delivery.code,
                  expectedDeliveryFee: delivery.fee,
                  expectedDeferredDeliveryFeeLimit: delivery.deferredFeeLimit,
                  addressCode,
                  discountCode: validDiscount?.discountCode || undefined,
                  idempotencyKey: attempt.current!.key,
                });
                attempt.current!.checkoutCode = result.code;
                try {
                  sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(attempt.current),
                  );
                } catch {
                  /* Browser storage is optional. */
                }
                if (
                  result.isExpired ||
                  result.isSubmitted ||
                  result.isPaid ||
                  Date.now() >= new Date(result.expiresAt).getTime()
                ) {
                  clearCheckoutAttempt(result.code);
                  attempt.current = undefined;
                  return toast.error(
                    "خرید قبلی پایان یافته است؛ دوباره ثبت خرید را بزنید",
                  );
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
            <div className="flex flex-wrap items-center justify-end gap-3">
              {!addresses.data?.items.length && (
                <p className="text-sm text-slate-500">
                  برای ارسال سفارش، نشانی خود را اضافه کنید.
                </p>
              )}
              <ActionButton variant="secondary" onClick={() => setOpen(true)}>
                <PlusIcon className="h-5 w-5" /> افزودن نشانی جدید
              </ActionButton>
            </div>
            <DeliveryChoice key={JSON.stringify([deliveryAddress, cart.data ? checkoutFingerprint(cart.data, addressCode, "") : ""])} countyCode={deliveryAddress?.countyCode} cartId={cart.data?.cartId} addressCode={addressCode} fingerprint={cart.data ? checkoutFingerprint(cart.data, addressCode, "") : ""} onSelect={setDelivery} />
            <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <TextField
                    label="کد تخفیف (اختیاری)"
                    dir="ltr"
                    value={discountCode}
                    maxLength={100}
                    disabled={discountPreview.isPending || create.isPending}
                    onChange={(e) => {
                      setDiscount(e.target.value);
                      setAppliedDiscount(undefined);
                    }}
                  />
                </div>
                <ActionButton
                  busy={discountPreview.isPending}
                  disabled={
                    !discountCode.trim() ||
                    !cart.data?.farms.length ||
                    create.isPending
                  }
                  onClick={async () => {
                    if (!cart.data?.cartId) return;
                    setAppliedDiscount(undefined);
                    const fingerprint = discountFingerprint;
                    try {
                      const result = await discountPreview.mutateAsync({
                        cartId: cart.data.cartId,
                        discountCode: discountCode.trim(),
                      });
                      setAppliedDiscount({ fingerprint, result });
                    } catch {}
                  }}
                >
                  اعمال تخفیف
                </ActionButton>
              </div>
              {validDiscount && (
                <p
                  role="status"
                  className="text-sm font-medium text-emerald-700"
                >
                  کد تخفیف اعمال شد؛ {money(validDiscount.discountAmount)}{" "}
                  تخفیف.
                </p>
              )}
              {discountCode.trim() &&
                !validDiscount &&
                !discountPreview.isPending && (
                  <p className="text-xs text-slate-500">
                    برای بررسی کد، «اعمال تخفیف» را بزنید.
                  </p>
                )}
            </div>
            <div className="space-y-3 rounded-xl bg-emerald-50 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span>جمع کالاهای سبد</span>
                <strong>
                  {money(validDiscount?.subtotal ?? cart.data?.totalPrice)}
                </strong>
              </div>
              {validDiscount && (
                <>
                  <div className="flex justify-between gap-3 text-emerald-700">
                    <span>تخفیف</span>
                    <strong>{money(validDiscount.discountAmount)}</strong>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-emerald-200 pt-3 font-bold text-emerald-800">
                    <span>مبلغ پس از تخفیف</span>
                    <strong>{money(validDiscount.payableAmount)}</strong>
                  </div>
                </>
              )}
            </div>
            <ActionBar>
              <ActionButton
                type="submit"
                busy={create.isPending}
                disabled={
                  !addressCode || !delivery ||
                  !cart.data?.farms.length ||
                  discountPreview.isPending ||
                  (!!discountCode.trim() && !validDiscount)
                }
              >
                ثبت خرید و مشاهده مبلغ نهایی
              </ActionButton>
            </ActionBar>
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
                {!item.isSubmitted && !item.isPaid && !!item.deferredDeliveryFeeLimit && <p>سقف رزرو جداگانه حمل نامشخص: {money(item.deferredDeliveryFeeLimit)} · مجموع رزرو: {money(item.payableAmount + item.deferredDeliveryFeeLimit)}</p>}
              </div>
              <div className="space-y-4" aria-label="سفارش‌های این خرید">
                {item.orders.map((order) => (
                  <section
                    key={order.code}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <h2 className="text-sm font-bold text-slate-800">
                        {order.farmName}
                      </h2>
                      <strong className="text-sm text-emerald-800">
                        {money(order.totalPrice)}
                      </strong>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {order.orderItems?.map((product) => (
                        <div
                          key={product.code}
                          className="flex items-start justify-between gap-3 py-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="text-slate-700">
                              {product.productName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              تعداد: {product.quantity.toLocaleString("fa-IR")} {saleUnitLabel(product.saleUnit)}
                            </p>
                          </div>
                          <span className="shrink-0 text-slate-600">
                            {money(product.lineTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/dashboard/orders/${encodeURIComponent(order.code)}`}
                      className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      مشاهده سفارش ←
                    </Link>
                  </section>
                ))}
              </div>
              {item.isSubmitted || item.isPaid ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
                  درخواست خرید ثبت شده است. وجه سفارش‌های در انتظار تأیید، رزرو
                  است و پس از تأیید فروشنده برداشت می‌شود؛ در صورت رد، رزرو آزاد
                  می‌شود. وضعیت هر مزرعه را در سفارش‌ها پیگیری کنید.
                  <div className="mt-5 flex justify-end">
                    <Link
                      href="/dashboard/orders"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:w-auto"
                    >
                      مشاهده سفارش‌ها
                      <span aria-hidden="true">←</span>
                    </Link>
                  </div>
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
        {open && (
          <AddressForm
            done={(address) => {
              if (address) setAddress(address.code);
              setOpen(false);
            }}
          />
        )}
      </FormPanel>
      {item && <DeliveryPanel checkoutCode={item.code} />}
      <FormPanel
        open={payOpen}
        onClose={() => setPayOpen(false)}
        busy={pay.isPending}
        title="تأیید رزرو وجه"
      >
        <p className="mb-6 text-sm leading-7">
          مبلغ {money((item?.payableAmount ?? 0) + (item?.deferredDeliveryFeeLimit ?? 0))} در کیف پول رزرو شود؟ {!!item?.deferredDeliveryFeeLimit && <>از این مبلغ، {money(item.deferredDeliveryFeeLimit)} سقف جداگانه حمل نامشخص است؛ هزینه واقعی تا همین سقف برداشت و باقی آزاد می‌شود. مازاد به تأیید دوباره شما نیاز دارد. </>} پس از تأیید
          فروشنده، مبلغ سفارش او برداشت می‌شود و در صورت رد سفارش، رزرو آن آزاد
          می‌شود.
        </p>
        <ActionBar>
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
        </ActionBar>
      </FormPanel>
      <FormPanel
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        busy={cancel.isPending}
        title="لغو خرید"
      >
        <p className="mb-6 text-sm">این خرید در انتظار پرداخت لغو شود؟</p>
        <ActionBar>
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
        </ActionBar>
      </FormPanel>
    </div>
  );
}
