"use client";
import { saleUnitLabel } from "../../../shared/utils/sale-units";

import DeliveryCostSummary from "./DeliveryCostSummary";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deliveryApi } from "@/lib/actions/delivery";
import { errorMessage } from "@/lib/actions/platform";
import { deliveryAddress, deliveryStatuses, type DeliveryBooking, } from "@/shared/types/delivery";
import { dateLabel, money } from "@/shared/utils/platform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { TextAreaField } from "@/design-system/molecules/platform/FormField";
function Booking({ booking: b, refresh }: { booking: DeliveryBooking; refresh: () => Promise<unknown> }) {
  const purchaseCode = useQuery({queryKey:["purchase-delivery-code",b.code],queryFn:()=>deliveryApi.purchaseCode(b.code),enabled:!!b.checkoutCode,retry:false});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function run(work: () => Promise<unknown>) { if (busy) return; setBusy(true); setError(""); try { await work(); await refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  return <section className="space-y-4 rounded-2xl border bg-white p-5" aria-label="تحویل بار">
    {b.deferredFeeLimit != null && b.deferredFeePaid == null && <div className="space-y-3 rounded-xl bg-amber-50 p-4"><p>رزرو هزینه حمل: {money(b.heldDeliveryFee)}. مازاد سقف بدون تأیید شما برداشت نمی‌شود.</p>{b.proposedDeferredFee != null && b.proposedDeferredFee > b.deferredFeeLimit && <><p>هزینه نهایی بخش نامشخص: {money(b.proposedDeferredFee)}؛ مازاد مورد نیاز: {money(b.proposedDeferredFee - b.deferredFeeLimit)}</p><ActionButton disabled={busy} onClick={() => void run(() => deliveryApi.acceptDeferredFee(b.code, b.proposedDeferredFee!))}>تأیید هزینه نهایی {money(b.proposedDeferredFee)} و پرداخت مازاد از کیف پول</ActionButton></>}</div>}
    {purchaseCode.data && <div className="rounded-xl bg-emerald-50 p-4"><p>کد تحویل کامل خرید</p><strong dir="ltr" className="text-2xl tracking-widest">{purchaseCode.data.code}</strong><p className="mt-2 text-sm">پس از دریافت و بررسی تمام اقلام خرید، این کد را به نماینده بدهید.</p></div>}
    {purchaseCode.isError && <button type="button" onClick={()=>void purchaseCode.refetch()}>دریافت کد ناموفق بود؛ تلاش دوباره</button>}
    <DeliveryCostSummary booking={b} /><h2 className="font-bold">تحویل بار · {b.method === "Pickup" ? "دریافت از میدان" : "ارسال مستقیم"}</h2>
    {b.groups?.map(g => <p key={g.pointCode}>{g.name} · {g.farmNames.join("، ")} · {g.address}</p>)}
    <p className="text-sm leading-7">{b.point}<br />بازه پیشنهادی: {b.window}<br />{b.method === "Direct" && deliveryAddress(b.address)}<br />مجموع هزینه حمل تأییدشده خریدار: {b.fee == null ? "در انتظار اعلام" : money(b.fee)}</p>
    <p className="rounded-xl bg-amber-50 p-3 text-sm leading-7">پس از دریافت و بررسی تعداد و سلامت ظاهری، کد را به نماینده بدهید.</p>
    {b.items.map(i => <p key={i.itemCode} className="text-sm">{i.name} ({saleUnitLabel(i.saleUnit)}) · {i.farmName}: سفارش {i.quantity}، رسیده به میدان {i.receivedAtHubQuantity}، تحویل شما {i.deliveredQuantity}</p>)}
    {!b.batches.length && <p className="text-sm">پس از رسیدن بار، شرکت نوبت تحویل و فهرست اقلام را ثبت می‌کند.</p>}
    <TextAreaField label="توضیح مشکل یا درخواست تغییر روش" value={note} maxLength={1000} onChange={e => setNote(e.target.value)} />
    {b.batches.map(batch => <article key={batch.code} className="space-y-3 rounded-xl border p-4">
      <h3 className="font-bold">محموله {batch.code} · {deliveryStatuses[batch.status] || batch.status}</h3><p className="text-sm">زمان هماهنگ‌شده: {dateLabel(batch.expectedAt)}</p>
      <ul className="list-inside list-disc text-sm">{batch.items.map(i => <li key={i.itemCode}>{i.name} ({saleUnitLabel(i.saleUnit)}) · {i.farmName} · تعداد {i.quantity}</li>)}</ul>
      {batch.note && <p className="text-sm text-red-700">{batch.note}</p>}
      {["Ready", "OutForDelivery"].includes(batch.status) && <>
        <ActionButton variant="danger" disabled={busy || note.trim().length < 3} onClick={() => void run(async () => { await deliveryApi.dispute(b.code, batch.code, note); })}>ثبت نرسیدن / کسری / آسیب و توقف تحویل</ActionButton>
      </>}
    </article>)}
    {b.requestedMethod ? <div className="space-y-3"><p>درخواست تغییر به {b.requestedMethod === "Direct" ? "ارسال مستقیم" : "دریافت از میدان"} · هزینه اضافه: {b.changeFee == null ? "در انتظار اعلام" : money(b.changeFee)}</p>
      {b.changeFee != null && <ActionButton disabled={busy} onClick={() => void run(() => deliveryApi.acceptChange(b.code, b.changeFee!))}>تأیید تغییر و پرداخت هزینه اضافه از کیف پول</ActionButton>}
      <ActionButton variant="secondary" disabled={busy} onClick={() => void run(() => deliveryApi.cancelChange(b.code))}>لغو درخواست تغییر</ActionButton></div> :
      b.method === "Pickup" && (b.deferredFeeLimit == null || b.deferredFeePaid != null) && !b.batches.some(x => ["Ready", "OutForDelivery", "Disputed", "Completed"].includes(x.status)) && <ActionButton variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => void run(() => deliveryApi.change(b.code, b.method === "Pickup" ? "Direct" : "Pickup", note))}>درخواست تغییر به {b.method === "Pickup" ? "ارسال مستقیم" : "دریافت از میدان"}</ActionButton>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
export default function DeliveryPanel({ checkoutCode }: { checkoutCode?: string }) {
  const q = useQuery({ queryKey: ["deliveries", checkoutCode], queryFn: () => deliveryApi.list(checkoutCode), enabled: !!checkoutCode, refetchInterval: 10000 });
  if (q.error) return <p role="alert">{errorMessage(q.error)}</p>;
  return <div className="space-y-4">{q.data?.items.map(b => <Booking key={b.code} booking={b} refresh={q.refetch} />)}</div>;
}
