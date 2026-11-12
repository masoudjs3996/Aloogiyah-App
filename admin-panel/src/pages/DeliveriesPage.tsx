import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Package, Search, RefreshCw, ArrowLeft, Info, CheckCircle2, Clock3 } from 'lucide-react';
import { request } from '../shared/api/client';
import type { DeliveryPage } from '../shared/types/delivery';
import { bookingState, completed, money } from '../shared/utils/delivery-workflow';
import Button from '../design-system/atoms/Button';
import PageIntro from '../design-system/molecules/PageIntro';
import SectionTabs from '../design-system/molecules/SectionTabs';
import ErrorState from '../design-system/molecules/ErrorState';
import DeliveryWorkspace from './DeliveryWorkspace';
import DeliverySetup, { LegacyDelivery } from './DeliverySetup';
import DeliveryRoutes from './DeliveryRoutes';

export default function DeliveriesPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('booking') ?? '', checkout = params.get('checkout') ?? '';
  const [tab, setTab] = useState<'queue' | 'points' | 'routes'>('queue'), [page, setPage] = useState(1), [draft, setDraft] = useState(checkout), [filter, setFilter] = useState('all');
  const q = useQuery<DeliveryPage>({ queryKey: ['deliveries-admin', page, checkout], queryFn: () => request('/Delivery/Bookings', 'GET', undefined, { manage: true, page, checkout: checkout || undefined }), enabled: tab === 'queue' && !selected, refetchInterval: 30000 });
  function select(code: string) { setParams(p => { p.set('booking', code); return p; }); }
  const items = q.data?.items ?? [], visible = items.filter(b => filter === 'all' || (filter === 'active' ? !!b.checkoutCode && !completed(b) : filter === 'quotes' ? !b.checkoutCode : completed(b)));
  if (tab === 'queue' && selected) return <DeliveryWorkspace key={selected} code={selected} onBack={() => { setParams(p => { p.delete('booking'); return p; }); void q.refetch(); }} />;
  return <>
    <PageIntro eyebrow="رسیدگی به سفارش‌ها" title="میدان بار و تحویل" description="خرید را پیدا کنید، رسیدن بار را ثبت کنید و تحویل نهایی را با کد خریدار تأیید کنید." />
    <SectionTabs value={tab} label="بخش‌های میدان بار" onChange={value => { setTab(value); setParams(p => { p.delete('booking'); return p; }); }} tabs={[{ value: 'queue', label: 'رسیدگی به خریدها' }, { value: 'points', label: 'میدان‌ها' }, { value: 'routes', label: 'مسیرها و تعرفه‌ها' }]} />
    {tab === 'points' && <DeliverySetup />}{tab === 'routes' && <DeliveryRoutes />}
    {tab === 'queue' && (selected ? <DeliveryWorkspace key={selected} code={selected} onBack={() => { setParams(p => { p.delete('booking'); return p; }); void q.refetch(); }} /> : <div className="page-stack">
      <div className="guide-box"><Info size={21} /><div><strong>از کجا شروع کنم؟</strong><p>روی «رسیدگی» خرید بزنید؛ قدم بعدی همان‌جا نوشته شده است. ورود به میدان کد نمی‌خواهد؛ کد شش‌رقمی فقط برای تحویل نهایی به خریدار است. تنظیم میدان و قیمت‌ها در دو بخش کناری انجام می‌شود.</p></div></div>
      <div className="delivery-queue-tools"><form onSubmit={e => { e.preventDefault(); setPage(1); setParams(p => { if (draft.trim()) p.set('checkout', draft.trim()); else p.delete('checkout'); return p; }); }}><input aria-label="جست‌وجوی برنامه با کد خرید" placeholder="کد خرید خریدار را وارد کنید" dir="ltr" maxLength={10} value={draft} onChange={e => setDraft(e.target.value)} /><Button variant="secondary"><Search size={16} />پیدا کردن خرید</Button></form>{checkout && <Button variant="ghost" onClick={() => { setDraft(''); setPage(1); setParams({}); }}>نمایش همه خریدها</Button>}<Button variant="secondary" disabled={q.isFetching} onClick={() => void q.refetch()}><RefreshCw size={16} />به‌روزرسانی</Button></div>
      <section className="panel"><div className="panel-toolbar"><div><h2>{checkout ? 'نتیجه جست‌وجوی خرید' : 'برنامه‌های تحویل'}</h2><p className="subtle">{q.data ? `${q.data.totalCount.toLocaleString('fa-IR')} برنامه در کل فهرست` : 'در حال دریافت برنامه‌ها…'}</p></div><Package size={22} className="muted" /></div>
        <div className="filter-pills" style={{ padding: '17px 20px 0' }} aria-label="محدودکردن برنامه‌های همین صفحه">{[{ value: 'all', label: 'همه این صفحه' }, { value: 'active', label: 'خریدهای در جریان' }, { value: 'quotes', label: 'استعلام‌ها' }, { value: 'done', label: 'تحویل‌شده‌ها' }].map(f => <button key={f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>{f.label}</button>)}</div>
        {q.isLoading ? <div className="loading">در حال دریافت خریدها…</div> : q.error ? <ErrorState error={q.error} retry={() => void q.refetch()} /> : visible.length === 0 ? <div className="empty"><Package size={35} /><h3>{checkout ? 'برنامه‌ای برای این خرید پیدا نشد' : 'موردی در این بخش نیست'}</h3><p>{checkout ? 'کد خرید را بررسی کنید. اگر خرید قدیمی بدون برنامه است، از بخش پایین برنامه تحویل بسازید.' : 'فیلتر همین صفحه را تغییر دهید یا صفحه بعد را بررسی کنید.'}</p></div> : visible.map(b => { const state = bookingState(b); return <article className="delivery-row" key={b.code}><span className="delivery-row-icon">{completed(b) ? <CheckCircle2 size={21} /> : b.checkoutCode ? <Package size={21} /> : <Clock3 size={21} />}</span><div className="delivery-row-info"><h3>{b.checkoutCode ? 'خرید' : 'استعلام'} <span className="code">{b.checkoutCode ?? b.code}</span><span className={'badge ' + state.tone}>{state.label}</span></h3><p>{b.method === 'Pickup' ? 'دریافت از میدان' : 'ارسال به نشانی'} · {b.point}</p></div><div className="delivery-row-meta"><span>{money(b.fee)}</span><span className="muted">{b.items.length > 0 ? b.items.length.toLocaleString('fa-IR') + ' قلم' : b.checkoutCode ? 'بدون قلم قابل تحویل' : 'پیش از ثبت خرید'}</span></div><Button variant="secondary" onClick={() => select(b.code)}>رسیدگی<ArrowLeft size={15} /></Button></article>; })}
        <div className="pagination"><span>صفحه {page.toLocaleString('fa-IR')} · فیلترها روی همین صفحه اعمال می‌شوند.</span><div className="toolbar"><Button variant="secondary" disabled={page <= 1 || q.isFetching} onClick={() => setPage(p => p - 1)}>قبلی</Button><Button variant="secondary" disabled={!q.data || page * 20 >= q.data.totalCount || q.isFetching} onClick={() => setPage(p => p + 1)}>بعدی</Button></div></div>
      </section><LegacyDelivery onCreated={select} />
    </div>)}
  </>;
}
