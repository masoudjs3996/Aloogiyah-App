"use client";
import { useState } from "react";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { formControlClass } from "@/design-system/atoms/formControlStyles";
import { TicketPercent, Copy, Check, MessageCircle, Info } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, errorMessage } from "@/lib/actions/platform";
import PersianDateTimeField from "@/design-system/molecules/platform/PersianDateTimeField";
import QueryState from "@/design-system/molecules/platform/QueryState";
import { persianToISO } from "@/shared/utils/persian-date";
import type {
  SellerDiscount,
  SellerProduct,
} from "@/shared/types/seller-sales";

const field = `mt-2 ${formControlClass}`;
export const salesMoney = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;
export const salesDate = (s: string | null) =>
  s
    ? new Date(s).toLocaleString("fa-IR", {
        timeZone: "Asia/Tehran",
        dateStyle: "medium",
      })
    : "—";
const numeric = (s: string) =>
  Number(
    s
      .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
      .replace(/[,٬]/g, ""),
  );

export default function SellerDiscountDialog({
  customerCode,
  customerName,
  onClose,
  onPrepare,
}: {
  customerCode: string;
  customerName: string;
  onClose: () => void;
  onPrepare?: (text: string) => void;
}) {
  const client = useQueryClient();
  const [farm, setFarm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState(0);
  const [value, setValue] = useState("");
  const [cap, setCap] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxUsage, setMaxUsage] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<SellerDiscount | null>(null);
  const products = useQuery({
    queryKey: ["seller-sales", "products"],
    queryFn: () => request<SellerProduct[]>("/SellerSales/Products"),
  });
  const recipient = useQuery({
    queryKey: ["seller-sales", "customer", customerCode],
    queryFn: () =>
      request<{ code: string; name: string }>(
        `/SellerSales/Customers/${encodeURIComponent(customerCode)}`,
      ),
  });
  const farms = [
    ...new Map(
      (products.data || []).map((p) => [
        p.farmCode,
        { code: p.farmCode, name: p.farmName },
      ]),
    ).values(),
  ];
  const text = created
    ? `کد تخفیف اختصاصی شما: ${created.code}\n${created.discountType === 0 || created.discountType === "Percentage" ? `${created.value.toLocaleString("fa-IR")}٪` : salesMoney(created.value)} تخفیف برای ${created.farmName}${created.productCodes.length ? "، فقط محصولات انتخاب‌شده" : "، همهٔ محصولات این مزرعه"}${created.maxDiscountAmount ? `، تا سقف ${salesMoney(created.maxDiscountAmount)}` : ""}.\nاعتبار تا ${new Date(created.endDate!).toLocaleString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" })}، حداکثر ${created.maxUsage?.toLocaleString("fa-IR")} بار؛ فقط برای حساب شما.`
    : "";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || created) return;
    setError("");
    const amount = numeric(value),
      limit = cap ? numeric(cap) : null,
      usage = numeric(maxUsage);
    let expiry: string;
    try {
      expiry = persianToISO(endDate);
    } catch {
      setError("تاریخ پایان معتبر وارد کنید.");
      return;
    }
    if (
      !farm ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      (type === 0 && amount > 100) ||
      (limit !== null && (!Number.isFinite(limit) || limit <= 0)) ||
      !Number.isInteger(usage) ||
      usage < 1 ||
      usage > 100 ||
      !expiry ||
      new Date(expiry).getTime() <= Date.now()
    ) {
      setError(
        "مزرعه، مقدار تخفیف، تاریخ آینده و تعداد استفادهٔ ۱ تا ۱۰۰ را معتبر وارد کنید.",
      );
      return;
    }
    setBusy(true);
    try {
      const result = await request<SellerDiscount>("/SellerSales/Discounts", {
        method: "POST",
        data: {
          customerCode,
          farmCode: farm,
          productCodes: selected,
          discountType: type,
          value: amount,
          maxDiscountAmount: limit,
          endDate: expiry,
          maxUsage: usage,
        },
      });
      setCreated(result);
      void client.invalidateQueries({ queryKey: ["seller-sales"] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormPanel
      open
      onClose={onClose}
      title="کد تخفیف اختصاصی مشتری"
      busy={busy}
    >
      <div className="space-y-5 text-slate-600">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TicketPercent className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] text-slate-400">کد اختصاصی برای</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {recipient.data?.name || customerName}
            </p>
          </div>
        </div>
        <QueryState
          loading={products.isLoading || recipient.isLoading}
          error={products.error || recipient.error}
          retry={() => {
            void products.refetch();
            void recipient.refetch();
          }}
        >
          {created ? (
            <div className="space-y-4">
              <p
                role="status"
                className="flex items-center gap-2 text-sm font-bold text-emerald-600"
              >
                <Check className="h-5 w-5" />
                کد ساخته شد.
              </p>
              <pre className="whitespace-pre-wrap break-words rounded-2xl border border-slate-100 bg-slate-50 p-4 font-sans text-sm leading-8 text-slate-600">
                {text}
              </pre>
              <p className="text-xs leading-7 text-slate-500">
                تأمین‌کننده: شما؛ مبلغ این تخفیف از سهم فروش شما کم می‌شود.
              </p>
              <div className="flex flex-wrap gap-3">
                <ActionButton
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(text);
                      setCopied(true);
                    } catch {
                      setError("کپی انجام نشد؛ متن کد را انتخاب و کپی کنید.");
                    }
                  }}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "کپی شد" : "کپی متن کد"}
                </ActionButton>
                {onPrepare && (
                  <ActionButton
                    onClick={() => {
                      onPrepare(text);
                      onClose();
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    قرار دادن در پیام
                  </ActionButton>
                )}
              </div>
              <p className="text-xs text-slate-400">
                کد به‌صورت خودکار ارسال نمی‌شود.
              </p>
            </div>
          ) : products.data?.length === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-7 text-amber-800">
              <Info className="mt-1 h-4 w-4 shrink-0" />
              <p>ابتدا برای مزرعهٔ خود محصول ثبت کنید.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm font-medium text-slate-600">
                مزرعه
                <select
                  required
                  className={field}
                  value={farm}
                  onChange={(e) => {
                    setFarm(e.target.value);
                    setSelected([]);
                  }}
                >
                  <option value="">انتخاب مزرعه</option>
                  {farms.map((f) => (
                    <option value={f.code} key={f.code}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              {farm && (
                <fieldset className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <legend className="px-2 text-sm font-medium text-slate-700">
                    محصولات مشمول
                  </legend>
                  <p className="text-xs leading-6 text-slate-400">
                    بدون انتخاب محصول، کد برای همهٔ محصولات همین مزرعه است.
                  </p>
                  <div className="max-h-44 overflow-y-auto">
                    {products.data
                      ?.filter((p) => p.farmCode === farm)
                      .map((p) => (
                        <label
                          key={p.code}
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-slate-600 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                            checked={selected.includes(p.code)}
                            onChange={(e) =>
                              setSelected((old) =>
                                e.target.checked
                                  ? [...old, p.code]
                                  : old.filter((code) => code !== p.code),
                              )
                            }
                          />
                          {p.name}
                        </label>
                      ))}
                  </div>
                </fieldset>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-600">
                  نوع تخفیف
                  <select
                    className={field}
                    value={type}
                    onChange={(e) => setType(Number(e.target.value))}
                  >
                    <option value={0}>درصدی</option>
                    <option value={1}>مبلغ ثابت به تومان</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-600">
                  {type === 0 ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
                  <input
                    required
                    inputMode="decimal"
                    className={field}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-600">
                سقف مبلغ تخفیف به تومان (اختیاری)
                <input
                  inputMode="decimal"
                  className={field}
                  value={cap}
                  onChange={(e) => setCap(e.target.value)}
                />
              </label>
              <PersianDateTimeField
                label="پایان اعتبار (زمان محلی شما)"
                required
                futureOnly
                maxDaysAhead={365}
                value={endDate}
                onChange={setEndDate}
              />
              <label className="block text-sm font-medium text-slate-600">
                حداکثر تعداد استفاده برای این مشتری
                <input
                  required
                  inputMode="numeric"
                  className={field}
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                />
              </label>
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <Info className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-7 text-amber-800">
                  این کد فقط برای حساب همین مشتری و محصولات مزرعهٔ انتخاب‌شده
                  است. هزینهٔ تخفیف را شما تأمین می‌کنید و از سهم فروشتان کم
                  می‌شود؛ تخفیف‌های الو گیاه هزینهٔ پلتفرم هستند.
                </p>
              </div>
              <ActionButton
                type="submit"
                className="w-full"
                busy={busy}
                disabled={!recipient.data}
              >
                <TicketPercent className="h-4 w-4" />
                ساخت کد با هزینهٔ خودم
              </ActionButton>
            </form>
          )}
        </QueryState>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs leading-6 text-rose-600"
          >
            {error}
          </p>
        )}
      </div>
    </FormPanel>
  );
}
