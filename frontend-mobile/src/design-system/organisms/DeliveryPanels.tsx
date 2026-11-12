import { saleUnitLabel } from "../../shared/utils/sale-units";
import { DeliveryCostSummary } from "./DeliveryCostSummary";
import { usePollingInterval } from "../../shared/hooks/usePollingInterval";
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryApi } from '../../api/delivery';
import { errorMessage } from '../../api/platform';
import { deliveryCodeDigits, deliveryAddress, deliveryStatuses, type DeliveryBooking, type DeliverySelection } from '../../shared/types/delivery';
import { money } from '../../shared/utils/format';
import { persianDate } from '../../shared/utils/persian-date';
import { Text } from '../atoms/Text';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Field } from '../atoms/Field';
import { PersianDateTimeField } from '../molecules/PersianDateTimeField';
import { dateError } from '../../shared/utils/persian-calendar';
import { Select } from '../molecules/Select';

export function DeliveryChoice({ cartId, addressCode, countyCode, fingerprint, onSelect }: { cartId?: string; addressCode?: string; countyCode?: string; fingerprint: string; onSelect: (v: DeliverySelection | undefined) => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const [limitText, setLimitText] = useState("");
  const [acceptedLimit, setAcceptedLimit] = useState<number>();
  const [acceptedPrice, setAcceptedPrice] = useState<number>();
  const [chosenPoint, setPointCode] = useState("");
  const [showOtherPoints, setShowOtherPoints] = useState(false);

  const [method, setMethod] = useState('Pickup'); const [window, setWindow] = useState('');
  const [booking, setBooking] = useState(''); const [quoted, setQuoted] = useState(''); const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const points = useQuery({ queryKey: ["delivery-destinations", cartId, fingerprint], queryFn: () => deliveryApi.destinations(cartId!), enabled: !!cartId && method === "Pickup" });
  const localPoints = (points.data ?? []).filter(p => !!countyCode && p.countyCode === countyCode);
  const hasOtherPoints = (points.data?.length ?? 0) > localPoints.length;
  const candidates = localPoints.length && (!showOtherPoints || !hasOtherPoints) ? localPoints : points.data ?? [];
  const pointCode = candidates.some(p => p.code === chosenPoint) ? chosenPoint : (!showOtherPoints || !hasOtherPoints) && localPoints.length === 1 ? localPoints[0].code : "";
  const key = JSON.stringify([fingerprint, addressCode, method, method === "Pickup" ? pointCode : "auto", window]);
  const q = useQuery({ queryKey: ['delivery-quote', booking], queryFn: () => deliveryApi.get(booking), enabled: !!booking && quoted === key, refetchInterval: usePollingInterval(10000) });
  const result = quoted === key ? q.data : undefined; const code = result?.code;
  const pending = !!result?.destinationCode && (result.hasUnpricedLegs ?? result.legs?.some(l => l.fee == null));
  const fee = result?.fee ?? (pending ? result?.knownFee ?? result?.legs?.reduce((sum, l) => sum + (l.fee ?? 0), 0) : undefined);
  const cap = pending ? Number(limitText) : 0;
  const capValid = !pending || Number.isInteger(cap) && cap > 0 && cap <= 1_000_000_000;
  const valid = !!result && new Date(result.quoteExpiresAt).getTime() > now;
  useEffect(() => { onSelect(accepted && acceptedPrice === fee && acceptedLimit === cap && capValid && valid && code && fee != null ? { code, fee, deferredFeeLimit: pending ? cap : undefined, fingerprint } : undefined); }, [accepted, acceptedPrice, acceptedLimit, cap, capValid, pending, valid, code, fee, fingerprint, onSelect]);
  const selectedPoint = candidates.find(p => p.code === pointCode);
  return <Card><Text bold>روش دریافت بار</Text><Text>روش تحویل را انتخاب کنید. برای ارسال به نشانی، مسیر مناسب بر اساس نشانی شما مشخص می‌شود؛ هزینه حمل را پیش از پرداخت می‌بینید و تأیید می‌کنید.</Text>
    {method === "Pickup" && points.error && <Text>{errorMessage(points.error)}</Text>}{method === "Pickup" && !points.isLoading && !points.error && !points.data?.length && <Text>میدان مشترکی برای دریافت تمام اقلام سبد فعال نیست؛ محصولات را بر اساس میدان فیلتر کنید یا با پشتیبانی هماهنگ کنید.</Text>}
    <Select label="روش دریافت" value={method} onChange={v => { setMethod(v); setAccepted(false); }} options={[{ value: 'Pickup', label: 'دریافت از میدان بار' }, { value: 'Direct', label: 'ارسال از میدان به خانه یا مغازه' }]} />
    {method === "Pickup" && <>
    {(showOtherPoints && hasOtherPoints || localPoints.length !== 1) && <Select disabled={points.isLoading || !!points.error || !points.data?.length} label="میدان دریافت" value={pointCode} onChange={v => { setPointCode(v); setAccepted(false); }} options={[{ value: "", label: "انتخاب میدان دریافت" }, ...candidates.map(p => ({ value: p.code, label: [p.name, p.countyName].filter(Boolean).join(" — ") }))]} />}
    {(!showOtherPoints || !hasOtherPoints) && localPoints.length === 1 && <Text bold>میدان دریافت در شهرستان نشانی شما: {localPoints[0].name}</Text>}
    {!!countyCode && !localPoints.length && !points.isLoading && !points.error && <Text>برای شهرستان نشانی شما میدان قابل دریافت پیدا نشد؛ در صورت تمایل، میدان شهرستان دیگری را انتخاب کنید.</Text>}
    {showOtherPoints && !hasOtherPoints && <Text muted>فعلاً میدان دیگری با مسیر فعال برای دریافت همه اقلام این سبد وجود ندارد.</Text>}
    {selectedPoint && <Text>{selectedPoint.address} · {selectedPoint.hours}{"\n"}{selectedPoint.collectionTerms}</Text>}
    {!!localPoints.length && !points.error && <Text accessibilityRole="button" style={{ fontSize: 12, color: "#065F46", textDecorationLine: "underline", paddingVertical: 12, alignSelf: "flex-end" }} onPress={() => { setShowOtherPoints(!showOtherPoints); if (hasOtherPoints) { setPointCode(""); setAccepted(false); } }}>{showOtherPoints ? "بازگشت به میدان‌های شهرستان من" : "دریافت از میدان دیگر"}</Text>}
    </>}
    <Text muted>بار پس از ثبت سفارش آماده می‌شود؛ زمان نهایی دریافت با شما هماهنگ خواهد شد.</Text>
    <PersianDateTimeField label="تاریخ و ساعت پیشنهادی تحویل" futureOnly maxDaysAhead={10} hint="تاریخ و ساعت را در بازه ۱۰ روز آینده انتخاب کنید؛ زمان نهایی با شما هماهنگ می‌شود." value={window} onChangeText={v => { setWindow(v); setAccepted(false); }} />
    <Button title="بررسی هزینه دریافت" outline busy={busy} disabled={!cartId || !addressCode || (method === "Pickup" && (!selectedPoint || !!points.error)) || !window.trim()} onPress={() => { if (!cartId || !addressCode || busy) return; const timeError = !window.trim() ? 'تاریخ و ساعت تحویل را انتخاب کنید.' : dateError(window, { futureOnly: true, maxDaysAhead: 10 }); if (timeError) { setError(timeError); return; } setBusy(true); setError(''); setAccepted(false); void deliveryApi.quote({ cartId, addressCode, pointCode: method === "Pickup" ? pointCode : undefined, method, window }).then(b => { setBooking(b.code); setQuoted(key); }).catch(e => setError(errorMessage(e))).finally(() => setBusy(false)); }} />
    {(error || q.error) && <Text>{error || errorMessage(q.error)}</Text>}
    {result && <DeliveryCostSummary booking={result} />}
    {result && pending && <><Text>هزینه قطعی فعلی: {money(fee)}. برای بخش نامشخص سقف مورد قبول خود را وارد کنید تا خرید بدون انتظار ثبت شود. این مبلغ جدا رزرو می‌شود؛ هزینه واقعی تا سقف شما برداشت و باقی آزاد می‌شود. هزینه بیشتر به تأیید دوباره شما نیاز دارد.</Text><Field label="سقف رزرو بخش نامشخص حمل (تومان)" keyboardType="number-pad" value={limitText} onChangeText={v => { setLimitText(deliveryCodeDigits(v)); setAccepted(false); }} /></>}
    {result && (fee == null ? <Text>هزینه حمل این رزرو قابل محاسبه نیست؛ دوباره بررسی کنید.</Text> : valid ? <Button disabled={!capValid} outline={accepted && acceptedPrice === fee && acceptedLimit === cap} title={accepted && acceptedPrice === fee && acceptedLimit === cap ? 'تأیید شد؛ لغو انتخاب' : pending ? `تأیید هزینه قطعی ${money(fee)} و رزرو جداگانه تا سقف ${money(cap)}` : `تأیید روش دریافت و هزینه ${money(fee)}`} onPress={() => { setAcceptedPrice(fee); setAcceptedLimit(cap); setAccepted(!(accepted && acceptedPrice === fee && acceptedLimit === cap)); }} /> : <Text>اعتبار هزینه تمام شده؛ دوباره بررسی کنید.</Text>)}
  </Card>;
}
function Booking({ b, refresh }: { b: DeliveryBooking; refresh: () => Promise<unknown> }) {
  const purchaseCode = useQuery({queryKey:["purchase-delivery-code",b.code],queryFn:()=>deliveryApi.purchaseCode(b.code),enabled:!!b.checkoutCode,retry:false});
  const [note, setNote] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function run(work: () => Promise<unknown>) { if (busy) return; setBusy(true); setError(''); try { await work(); await refresh(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  return <Card><DeliveryCostSummary booking={b} /><Text bold>تحویل بار · {b.method === 'Pickup' ? 'دریافت از میدان' : 'ارسال مستقیم'}</Text><Text>{b.point}</Text>{b.groups?.map(g => <Text key={g.pointCode}>{g.name} · {g.farmNames.join("، ")} · {g.address}</Text>)}<Text>بازه پیشنهادی: {b.window}</Text>{b.method === 'Direct' && <Text>{deliveryAddress(b.address)}</Text>}<Text>مجموع هزینه حمل تأییدشده خریدار: {b.fee == null ? 'در انتظار اعلام' : money(b.fee)}</Text>
    {b.deferredFeeLimit != null && b.deferredFeePaid == null && <><Text>رزرو هزینه حمل: {money(b.heldDeliveryFee)}. مازاد سقف بدون تأیید شما برداشت نمی‌شود.</Text>{b.proposedDeferredFee != null && b.proposedDeferredFee > b.deferredFeeLimit && <><Text>هزینه نهایی بخش نامشخص: {money(b.proposedDeferredFee)}؛ مازاد مورد نیاز: {money(b.proposedDeferredFee - b.deferredFeeLimit)}</Text><Button disabled={busy} title={`تأیید هزینه نهایی ${money(b.proposedDeferredFee)} و پرداخت مازاد از کیف پول`} onPress={() => void run(() => deliveryApi.acceptDeferredFee(b.code, b.proposedDeferredFee!))} /></>}</>}
    {purchaseCode.data && <><Text bold>کد تحویل کامل خرید</Text><Text selectable style={{fontSize:26,textAlign:"center"}}>{purchaseCode.data.code}</Text><Text>پس از دریافت و بررسی تمام اقلام خرید، این کد را به نماینده بدهید.</Text></>}
    {purchaseCode.isError && <Button outline title="تلاش دوباره برای دریافت کد" onPress={()=>void purchaseCode.refetch()}/>}
    <Text>پس از دریافت و بررسی تعداد و سلامت ظاهری، کد را به نماینده بدهید.</Text>
    {b.items.map(i => <Text key={i.itemCode}>{i.name} ({saleUnitLabel(i.saleUnit)}) · {i.farmName}: سفارش {i.quantity}، میدان {i.receivedAtHubQuantity}، تحویل شما {i.deliveredQuantity}</Text>)}
    {!b.batches.length && <Text muted>پس از رسیدن بار، شرکت نوبت تحویل را ثبت می‌کند.</Text>}
    <Field label="توضیح مشکل یا تغییر روش" value={note} onChangeText={setNote} maxLength={1000} multiline />
    {b.batches.map(batch => <Card key={batch.code}><Text bold>محموله {batch.code} · {deliveryStatuses[batch.status]}</Text><Text>زمان: {persianDate(batch.expectedAt, true)}</Text>{batch.items.map(i => <Text key={i.itemCode}>{i.name} ({saleUnitLabel(i.saleUnit)}) · {i.farmName} · تعداد {i.quantity}</Text>)}{batch.note && <Text>{batch.note}</Text>}
      {['Ready', 'OutForDelivery'].includes(batch.status) && <>

        <Button outline disabled={busy || note.trim().length < 3} title="ثبت نرسیدن / کسری / آسیب و توقف تحویل" onPress={() => void run(async () => { await deliveryApi.dispute(b.code, batch.code, note); })} />
      </>}
    </Card>)}
    {b.requestedMethod ? <><Text>تغییر به {b.requestedMethod === 'Direct' ? 'ارسال مستقیم' : 'دریافت از میدان'} · هزینه اضافه: {b.changeFee == null ? 'منتظر اعلام' : money(b.changeFee)}</Text>{b.changeFee != null && <Button disabled={busy} title="تأیید تغییر و پرداخت هزینه اضافه از کیف پول" onPress={() => void run(() => deliveryApi.acceptChange(b.code, b.changeFee!))} />}<Button outline disabled={busy} title="لغو درخواست تغییر" onPress={() => void run(() => deliveryApi.cancelChange(b.code))} /></> : b.method === "Pickup" && (b.deferredFeeLimit == null || b.deferredFeePaid != null) && !b.batches.some(x => ['Ready', 'OutForDelivery', 'Disputed', 'Completed'].includes(x.status)) && <Button outline disabled={busy || note.trim().length < 3} title={`درخواست تغییر به ${b.method === 'Pickup' ? 'ارسال مستقیم' : 'دریافت از میدان'}`} onPress={() => void run(() => deliveryApi.change(b.code, b.method === 'Pickup' ? 'Direct' : 'Pickup', note))} />}
    {error && <Text>{error}</Text>}
  </Card>;
}
export function DeliveryPanel({ checkoutCode }: { checkoutCode?: string }) {
  const q = useQuery({ queryKey: ['deliveries', checkoutCode], queryFn: () => deliveryApi.list(checkoutCode), enabled: !!checkoutCode, refetchInterval: usePollingInterval(10000) });
  return <>{q.error && <Text>{errorMessage(q.error)}</Text>}{q.data?.items.map(b => <Booking key={b.code} b={b} refresh={q.refetch} />)}</>;
}
