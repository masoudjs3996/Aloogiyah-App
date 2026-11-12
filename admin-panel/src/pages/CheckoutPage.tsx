import { saleUnitLabel } from "../shared/utils/sale-units";
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Info, ArrowLeft } from 'lucide-react';
import { request } from '../shared/api/client';
import { Values } from '../design-system/organisms/RecordDetail';
import Button from '../design-system/atoms/Button';
import PageIntro from '../design-system/molecules/PageIntro';
import ErrorState from '../design-system/molecules/ErrorState';
import { money } from '../shared/utils/delivery-workflow';
import type { Row } from '../shared/types';

export default function CheckoutPage() {
  const [params, setParams] = useSearchParams(), code = params.get('code') ?? '';
  const [draft, setDraft] = useState(code);
  const q = useQuery<Row>({ queryKey: ['checkout', code], queryFn: () => request('/Checkout/' + encodeURIComponent(code)), enabled: !!code, retry: false });
  const orders: Row[] = q.data?.orders ?? [];
  return <><PageIntro eyebrow="بررسی سفارش‌ها" title="بررسی خرید با کد" description="هر خرید ممکن است سفارش چند مزرعه را شامل شود. کد خرید خریدار را برای مشاهده جزئیات وارد کنید." />
    <section className="panel panel-pad"><form className="delivery-queue-tools" onSubmit={e => { e.preventDefault(); setParams({ code: draft.trim() }); }}><label className="field" style={{ flex: 1, maxWidth: 350 }}>کد خرید<input aria-label="کد خرید" placeholder="کد خرید صفحه خریدار" dir="ltr" maxLength={10} required value={draft} onChange={e => setDraft(e.target.value)} /></label><Button disabled={q.isFetching}><Search size={16} />مشاهده خرید</Button></form>
      {!code && <div className="guide-box"><Info size={21} /><div><strong>برای ثبت ورود بار یا تأیید تحویل، بخش تحویل را باز کنید.</strong><p>این صفحه برای مشاهده وضعیت خرید است. کد شش‌رقمی خریدار در بخش «میدان بار و تحویل» ثبت می‌شود.</p><Link className="text-button" to="/deliveries">رفتن به بخش تحویل ←</Link></div></div>}
      {q.isLoading && <p className="loading">در حال دریافت خرید…</p>}{q.error && <ErrorState error={q.error} retry={() => void q.refetch()} />}
      {q.data && <><div className="checkout-summary"><div><small>مبلغ خرید و حمل قطعی اولیه</small><strong>{money(q.data.payableAmount)}</strong></div><div><small>سقف جداگانه حمل نامشخص</small><strong>{q.data.deferredDeliveryFeeLimit ? money(q.data.deferredDeliveryFeeLimit) : 'ندارد'}</strong></div><div><small>وضعیت خرید</small><strong>{q.data.isExpired ? 'مهلت خرید پایان یافته' : q.data.paymentStatus === 'Paid' ? 'پرداخت‌شده' : q.data.paymentStatus === 'PartiallyPaid' ? 'بخشی پرداخت‌شده' : q.data.isSubmitted ? 'ثبت و ارسال به مزرعه‌ها' : 'در انتظار ثبت نهایی'}</strong></div></div><div className="section-head"><h2>سفارش‌های این خرید</h2><Link className="button secondary" to={'/deliveries?checkout=' + encodeURIComponent(code)}><Package size={16} />رسیدگی به تحویل<ArrowLeft size={15} /></Link></div><div className="checkout-orders">{orders.map(order => <article className="checkout-order" key={order.code}><header><h3>{order.farmName || 'سفارش مزرعه'} <span className="code-chip">{order.code}</span></h3><span className="badge">{order.statusTitle || 'در حال بررسی'}</span></header><p className="subtle">مبلغ این سفارش: {money(order.totalPrice)}</p><ul>{order.orderItems?.map((item: Row) => <li key={item.code}>{item.productName} · تعداد {Number(item.quantity).toLocaleString('fa-IR')} {saleUnitLabel(item.saleUnit)}</li>)}</ul><Link className="text-button" to="/manage/AgriculturalOrder">مشاهده فهرست سفارش‌های کشاورزی ←</Link></article>)}</div><details className="disclosure detail-section"><summary>اطلاعات کامل و سوابق خرید</summary><div className="disclosure-body"><Values value={q.data} /></div></details></>}
    </section>
  </>;
}
