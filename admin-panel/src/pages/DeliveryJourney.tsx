import MoneyInput from "../design-system/molecules/MoneyInput";
import { saleUnitLabel } from "../shared/utils/sale-units";
import { useState } from 'react';
import { Truck, Info, CheckCircle2 } from 'lucide-react';
import { request } from '../shared/api/client';
import type { DeliveryBooking } from '../shared/types/delivery';
import { money, feePending, shipped } from '../shared/utils/delivery-workflow';
import Button from '../design-system/atoms/Button';

export default function DeliveryJourney({ booking: b, busy, run, mode = 'fees' }: { booking: DeliveryBooking; busy: boolean; run: (work: () => Promise<unknown>) => Promise<void>; mode?: 'fees' | 'transfer' }) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  if (!b.destinationCode) return null;
  const legs = mode === 'transfer' ? (b.legs ?? []).filter(l => l.kind === 'InterHub') : b.legs ?? [];
  const allReviewed = b.items.length > 0 && b.items.every(i => i.isPaid !== false);
  return <section className="page-stack">
    {mode === 'fees' && <><div className="financial-summary"><div><small>هزینه قطعی ثبت‌شده</small><strong>{money(b.fee ?? b.knownFee)}</strong></div><div><small>سقف بخش نامشخص</small><strong>{b.deferredFeeLimit == null ? 'ندارد' : money(b.deferredFeeLimit)}</strong></div><div><small>وضعیت رزرو حمل</small><strong>{b.deferredFeePaid != null ? 'تسویه و آزادسازی انجام شد' : b.deferredFeeLimit != null ? money(b.heldDeliveryFee) : 'رزرو جداگانه ندارد'}</strong></div></div>{feePending(b) && <div className="guide-box"><Info size={20} /><div><strong>هزینه نهایی را برای هر بخش وارد کنید.</strong><p>بعد از پایان بررسی همه مزرعه‌ها، مبلغ تا سقف خریدار از رزرو تسویه می‌شود و باقی آزاد می‌شود. مازاد بدون تأیید دوباره خریدار برداشت نمی‌شود.</p></div></div>}</>}
    {mode === 'fees' && legs.length === 0 && <p className="notice">دریافت از همان میدان مبدأ است؛ کرایه انتقال بین میدان‌ها ندارد.</p>}
    <div className="route-cards">{legs.map(l => {
      const source = b.items.filter(i => i.interHub && i.originCode === l.originCode);
      const sourceKnown = !!l.originCode && source.length > 0;
      const ready = sourceKnown && source.every(i => shipped(i) && (i.receivedAtOriginQuantity ?? 0) >= i.quantity);
      const canDispatch = !feePending(b) && !b.requestedMethod && ready;
      return <article key={l.code} className="route-card"><div className="card-heading"><div><h3 className="inline-icon">{mode === 'transfer' ? <Truck size={17} /> : null}{l.kind === 'InterHub' ? 'انتقال بین میدان‌ها' : 'ارسال از میدان به نشانی'}</h3><p>{l.route}</p></div><span className={'badge ' + (l.status === 'Arrived' ? 'green' : 'blue')}>{({ Waiting: 'منتظر اعزام', InTransit: 'در مسیر', Arrived: 'رسیده' } as Record<string, string>)[l.status] || l.status}</span></div>
        {mode === 'fees' ? <><p className="subtle">کرایه: <b>{money(l.fee)}</b>{l.kind === 'InterHub' && ` · حدود ${l.transitDays.toLocaleString('fa-IR')} روز پس از آماده‌شدن بار`}</p>{(!b.checkoutCode || l.isDeferred && b.deferredFeePaid == null) && <div className="receipt-controls"><label>هزینه نهایی این بخش (تومان)<MoneyInput value={prices[l.code] ?? ''} onChange={value => setPrices({ ...prices, [l.code]: value })} /></label><Button disabled={busy || !prices[l.code]?.trim() || !!b.checkoutCode && !allReviewed} onClick={() => void run(() => request(`/Delivery/Bookings/${encodeURIComponent(b.code)}/Legs/${encodeURIComponent(l.code)}/Price`, 'POST', { fee: Number(prices[l.code]) }))}>ثبت هزینه این بخش</Button>{b.checkoutCode && !allReviewed && <small className="field-help">پس از تأیید یا رد سفارش همه مزرعه‌ها فعال می‌شود.</small>}</div>}</> : <div className="receipt-controls">{l.status === 'Waiting' ? <><Button disabled={busy || !b.checkoutCode || sourceKnown && !canDispatch || feePending(b) || !!b.requestedMethod} onClick={() => void run(() => request(`/Delivery/Bookings/${encodeURIComponent(b.code)}/Legs/${encodeURIComponent(l.code)}/Dispatch`, 'POST'))}><Truck size={15} />ثبت اعزام به میدان دریافت</Button><p className="field-help">{feePending(b) ? 'ابتدا هزینه نامشخص را نهایی و تسویه کنید.' : sourceKnown && !ready ? 'ابتدا ورود کامل اقلام این مبدأ و ارسال کشاورز را ثبت کنید.' : 'فقط پس از خروج واقعی بار از میدان مبدأ ثبت کنید.'}</p></> : <p className="status-caption"><CheckCircle2 size={16} />{l.status === 'InTransit' ? 'اعزام ثبت شده؛ پس از رسیدن بار، ورود به میدان دریافت را ثبت کنید.' : 'ورود اقلام این مسیر به میدان دریافت ثبت شده است.'}</p>}</div>}
        {mode === 'fees' && !!l.pricingDetails?.length && <details><summary>محاسبه بر اساس مقدار دسته‌بندی‌ها</summary>{l.pricingDetails.map(d => <p key={d.key}>{d.blockSize == null && d.fee != null ? `${d.name} · ${money(d.fee)}` : <>{d.name}: {d.quantity.toLocaleString('fa-IR')} {saleUnitLabel(d.saleUnit)}؛ {d.blockSize == null ? 'تعرفه نیازمند بررسی' : `هر ${d.blockSize.toLocaleString('fa-IR')} ${saleUnitLabel(d.saleUnit)}، ${money(d.pricePerBlock)} · ${d.blockCount?.toLocaleString('fa-IR')} واحد حمل · ${money(d.fee)}`}</>}</p>)}</details>}
      </article>;
    })}</div>
  </section>;
}
