"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deliveryApi } from "@/lib/actions/delivery";
import { errorMessage } from "@/lib/actions/platform";
import { money } from "@/shared/utils/platform";
import { deliveryCodeDigits, type DeliverySelection } from "@/shared/types/delivery";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { SelectField, TextField } from "@/design-system/molecules/platform/FormField";
import PersianDateTimeField from "@/design-system/molecules/platform/PersianDateTimeField";
import DeliveryCostSummary from "./DeliveryCostSummary";
import { dateError } from "@/shared/utils/persian-calendar";

export default function DeliveryChoice({ cartId, addressCode, countyCode, fingerprint, onSelect }: {
  cartId?: string; addressCode: string; countyCode?: string; fingerprint: string; onSelect: (value: DeliverySelection | undefined) => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const [limitText, setLimitText] = useState("");
  const [acceptedLimit, setAcceptedLimit] = useState<number>();
  const [acceptedPrice, setAcceptedPrice] = useState<number>();
  const [chosenPoint, setPointCode] = useState("");
  const [showOtherPoints, setShowOtherPoints] = useState(false);

  const [method, setMethod] = useState("Pickup");
  const [window, setWindow] = useState(""); const [bookingCode, setBookingCode] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [accepted, setAccepted] = useState(false);
  const points = useQuery({ queryKey: ["delivery-destinations", cartId, fingerprint], queryFn: () => deliveryApi.destinations(cartId!), enabled: !!cartId && method === "Pickup" });
  const localPoints = (points.data ?? []).filter(p => !!countyCode && p.countyCode === countyCode);
  const hasOtherPoints = (points.data?.length ?? 0) > localPoints.length;
  const candidates = localPoints.length && (!showOtherPoints || !hasOtherPoints) ? localPoints : points.data ?? [];
  const pointCode = candidates.some(p => p.code === chosenPoint) ? chosenPoint : (!showOtherPoints || !hasOtherPoints) && localPoints.length === 1 ? localPoints[0].code : "";
  const key = JSON.stringify([fingerprint, addressCode, method, method === "Pickup" ? pointCode : "auto", window]);
  const [quoteKey, setQuoteKey] = useState("");
  const quote = useQuery({ queryKey: ["delivery-quote", bookingCode], queryFn: () => deliveryApi.get(bookingCode), enabled: !!bookingCode && quoteKey === key, refetchInterval: 10000 });
  const result = quoteKey === key ? quote.data : undefined;
  const pending = !!result?.destinationCode && (result.hasUnpricedLegs ?? result.legs?.some(l => l.fee == null));
  const fee = result?.fee ?? (pending ? result?.knownFee ?? result?.legs?.reduce((sum, l) => sum + (l.fee ?? 0), 0) : undefined);
  const cap = pending ? Number(limitText) : 0;
  const capValid = !pending || Number.isInteger(cap) && cap > 0 && cap <= 1_000_000_000;
  const code = result?.code;
  const valid = !!result && new Date(result.quoteExpiresAt).getTime() > now;
  useEffect(() => { onSelect(accepted && acceptedPrice === fee && acceptedLimit === cap && capValid && valid && code && fee != null ? { code, fee, deferredFeeLimit: pending ? cap : undefined, fingerprint } : undefined); }, [accepted, acceptedPrice, acceptedLimit, cap, capValid, pending, valid, code, fee, fingerprint, onSelect]);
  const selectedPoint = candidates.find(p => p.code === pointCode);
  return <section className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4" aria-label="روش دریافت">
    <h2 className="font-bold">روش دریافت بار</h2><p className="text-sm leading-7">روش تحویل را انتخاب کنید. برای ارسال به نشانی، مسیر مناسب بر اساس نشانی شما مشخص می‌شود؛ هزینه حمل را پیش از پرداخت می‌بینید و تأیید می‌کنید.</p>
    {method === "Pickup" && points.error && <p role="alert">{errorMessage(points.error)}</p>}
    {method === "Pickup" && !points.isLoading && !points.error && !points.data?.length && <p>فعلاً میدان مشترکی برای دریافت تمام اقلام سبد فعال نیست؛ محصولات را بر اساس میدان فیلتر کنید یا با پشتیبانی هماهنگ کنید.</p>}
    <SelectField label="روش دریافت" value={method} onChange={e => { setMethod(e.target.value); setAccepted(false); }}><option value="Pickup">دریافت از میدان بار</option><option value="Direct">ارسال از میدان به خانه یا مغازه</option></SelectField>
    {method === "Pickup" && <>
    {(showOtherPoints && hasOtherPoints || localPoints.length !== 1) && <SelectField disabled={points.isLoading || !!points.error || !points.data?.length} label="میدان دریافت" value={pointCode} onChange={e => { setPointCode(e.target.value); setAccepted(false); }}><option value="">انتخاب میدان دریافت</option>{candidates.map(p => <option key={p.code} value={p.code}>{[p.name, p.countyName].filter(Boolean).join(" — ")}</option>)}</SelectField>}
    {(!showOtherPoints || !hasOtherPoints) && localPoints.length === 1 && <p className="text-sm font-bold">میدان دریافت در شهرستان نشانی شما: {localPoints[0].name}</p>}
    {!!countyCode && !localPoints.length && !points.isLoading && !points.error && <p className="text-sm">برای شهرستان نشانی شما میدان قابل دریافت پیدا نشد؛ در صورت تمایل، میدان شهرستان دیگری را انتخاب کنید.</p>}
    {showOtherPoints && !hasOtherPoints && <p role="status" className="text-xs leading-6 text-slate-500">فعلاً میدان دیگری با مسیر فعال برای دریافت همه اقلام این سبد وجود ندارد.</p>}
    {selectedPoint && <p className="text-sm leading-7">{selectedPoint.address} · {selectedPoint.hours}<br />{selectedPoint.collectionTerms}</p>}
    {!!localPoints.length && !points.error && <button type="button" aria-expanded={showOtherPoints} className="inline-flex min-h-11 items-center text-xs font-medium text-emerald-800 underline underline-offset-4" onClick={() => { setShowOtherPoints(!showOtherPoints); if (hasOtherPoints) { setPointCode(""); setAccepted(false); } }}>{showOtherPoints ? "بازگشت به میدان‌های شهرستان من" : "دریافت از میدان دیگر"}</button>}
    </>}
    <p className="text-xs text-slate-500">بار پس از ثبت سفارش آماده می‌شود؛ زمان نهایی دریافت با شما هماهنگ خواهد شد.</p>
    <PersianDateTimeField required futureOnly maxDaysAhead={10} label="تاریخ و ساعت پیشنهادی دریافت" hint="تاریخ و ساعت دریافت را در بازهٔ ۱۰ روز آینده انتخاب کنید." value={window} onChange={value => { setWindow(value); setAccepted(false); }} />
    <ActionButton variant="secondary" busy={busy} disabled={!cartId || !addressCode || (method === "Pickup" && (!selectedPoint || !!points.error)) || !window.trim()} onClick={async () => {
      if (!cartId) return;
      const timeError = !window.trim() ? "تاریخ و ساعت دریافت را انتخاب کنید." : dateError(window, { futureOnly: true, maxDaysAhead: 10 });
      if (timeError) { setError(timeError); return; }
      setBusy(true); setError(""); setAccepted(false);
      try { const b = await deliveryApi.quote({ cartId, addressCode, pointCode: method === "Pickup" ? pointCode : undefined, method, window }); setQuoteKey(key); setBookingCode(b.code); }
      catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
    }}>بررسی هزینه دریافت</ActionButton>
    {(error || quote.error) && <p role="alert" className="text-red-700">{error || errorMessage(quote.error)}</p>}
    {result && <DeliveryCostSummary booking={result} />}
    {result && pending && <div className="space-y-3"><p className="text-sm leading-7">هزینه قطعی فعلی: {money(fee)}. برای بخش نامشخص، سقف مورد قبول خود را تعیین کنید تا خرید بدون انتظار ثبت شود. این مبلغ جداگانه رزرو می‌شود؛ هزینه واقعی تا همین سقف برداشت و باقیمانده آزاد می‌شود. مبلغ بیشتر فقط با تأیید دوباره شما پرداخت خواهد شد.</p><TextField label="سقف رزرو بخش نامشخص حمل (تومان)" inputMode="numeric" value={limitText} onChange={e => { setLimitText(deliveryCodeDigits(e.target.value)); setAccepted(false); }} /></div>}
    {result && (fee == null ? <p>هزینه حمل این رزرو قابل محاسبه نیست؛ دوباره بررسی کنید.</p> : valid ? <label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={!capValid} checked={accepted && acceptedPrice === fee && acceptedLimit === cap} onChange={e => { setAcceptedPrice(fee); setAcceptedLimit(cap); setAccepted(e.target.checked); }} />{pending ? `هزینه قطعی ${money(fee)} و رزرو جداگانه تا سقف ${money(cap)} برای بخش نامشخص حمل را تأیید می‌کنم.` : `روش دریافت و هزینه ارسال ${money(fee)} را تأیید می‌کنم.`}</label> : <p>اعتبار هزینه تمام شده؛ دوباره بررسی کنید.</p>)}
  </section>;
}

