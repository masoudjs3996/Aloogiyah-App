import { RouteCategoryTariffs, TariffIncrease } from "./DeliveryTariffs";
import MoneyInput from "../design-system/molecules/MoneyInput";
import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Route, Info, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { request } from '../shared/api/client';
import type { DeliveryPoint, DeliveryRoute } from '../shared/types/delivery';
import Button from '../design-system/atoms/Button';
import Modal from '../design-system/molecules/Modal';
import ErrorState from '../design-system/molecules/ErrorState';

export function DeliveryPointCountySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const q = useQuery<{ id: number; name: string }[]>({ queryKey: ['delivery-counties'], queryFn: () => request('/Delivery/Counties'), staleTime: 300000 });
  return <label>شهرستان سرویس‌دهی<select disabled={q.isLoading || !!q.error} value={value} onChange={e => onChange(e.target.value)}><option value="">انتخاب شهرستان</option>{q.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{q.error && <span role="alert" className="red-text">{q.error.message}</span>}</label>;
}
const empty = { isBidirectional: false, pricingMode: 'CategoryUnits' as 'Flat' | 'CategoryUnits', code: '', originCode: '', destinationCode: '', fee: '', transitDays: '1', maxQuantity: '', isActive: true };
export default function DeliveryRoutes() {
  const q = useQuery<DeliveryRoute[]>({ queryKey: ['delivery-routes-admin'], queryFn: () => request('/Delivery/Routes') });
  const points = useQuery<DeliveryPoint[]>({ queryKey: ['delivery-points-admin'], queryFn: () => request('/Delivery/Points', 'GET', undefined, { manage: true }) });
  const [draft, setDraft] = useState<typeof empty | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [tariffRoute, setTariffRoute] = useState<DeliveryRoute>();
  const [increaseOpen, setIncreaseOpen] = useState(false);
  function editRoute(route: DeliveryRoute, useCategoryPricing = false) {
    setDraft({
      ...route,
      isBidirectional: route.isBidirectional ?? false,
      pricingMode: useCategoryPricing ? 'CategoryUnits' : route.pricingMode ?? 'Flat',
      fee: route.fee == null ? '' : String(route.fee),
      transitDays: String(route.transitDays),
      maxQuantity: route.maxQuantity == null ? '' : String(route.maxQuantity),
    });
    setError('');
  }

  async function saveRoute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const openTariffs = draft.pricingMode === 'CategoryUnits' &&
      submitter instanceof HTMLButtonElement && submitter.value === 'tariffs';
    setBusy(true);
    setError('');
    try {
      await request('/Delivery/Routes' + (draft.code ? '/' + draft.code : ''), draft.code ? 'PUT' : 'POST', {
        ...draft,
        fee: draft.fee === '' ? null : Number(draft.fee),
        transitDays: Number(draft.transitDays),
        maxQuantity: draft.pricingMode === 'Flat' && draft.maxQuantity !== '' ? Number(draft.maxQuantity) : null,
      });
      const { data } = await q.refetch();
      setDraft(null);
      if (openTariffs) {
        setTariffRoute(data?.find(r => r.originCode === draft.originCode && r.destinationCode === draft.destinationCode));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ذخیره مسیر انجام نشد.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="page-stack"><div className="section-head"><div><h2>مسیرها و تعرفه‌های بین‌شهری</h2><p>کرایه انتقال از یک میدان به میدان دیگر را اینجا تعریف کنید.</p></div><Button disabled={!points.data?.some(p => p.isActive)} onClick={() => { setDraft(empty); setError(''); }}><Plus size={17} />افزودن مسیر</Button><Button variant="secondary" onClick={() => setIncreaseOpen(true)}>افزایش درصدی تعرفه‌ها</Button></div><div className="guide-box"><Info size={20} /><div><strong>تعرفه دسته‌ها و کرایه پایه</strong><p>روی «تعرفه دسته‌ها» در کارت مسیر بزنید تا نرخ هر دسته را تنظیم کنید. کرایه پایه را می‌توانید در «ویرایش مسیر» وارد کنید. برای استفاده از نرخ‌های یکسان در هر دو جهت، گزینه رفت‌وبرگشت را فعال کنید.</p></div></div>
    {q.isLoading && <p className="loading">در حال دریافت مسیرها…</p>}{(q.error || points.error) && <ErrorState error={(q.error || points.error)!} retry={() => { void q.refetch(); void points.refetch(); }} />}
    {q.data?.length === 0 && <div className="empty"><Route size={34} /><h3>مسیری تعریف نشده است</h3><p>ابتدا میدان‌های مبدأ و مقصد را ثبت کنید، سپس مسیر و کرایه انتقال را اضافه کنید.</p></div>}
    <div className="card-grid">{q.data?.map(r => <article key={r.code} className="record-card"><div className="card-heading"><span className="inline-icon"><Route size={17} />انتقال بین میدان‌ها</span><span className={'badge ' + (r.isActive ? 'green' : '')}>{r.isActive ? 'فعال' : 'غیرفعال'}</span></div><div className="route-line"><b>{r.originName}</b><span />{r.isBidirectional ? <ArrowLeftRight size={16} aria-label="رفت‌وبرگشت" /> : <ArrowLeft size={16} />}<b>{r.destinationName}</b></div><dl className="info-list"><div><dt>کرایه محموله</dt><dd>{r.pricingMode === 'CategoryUnits' ? 'بر اساس مقدار هر دسته‌بندی (' + (r.tariffCount ?? 0).toLocaleString('fa-IR') + ' تعرفه)' : r.fee == null ? 'اعلام هزینه موردی' : r.fee.toLocaleString('fa-IR') + ' تومان'}</dd></div>{r.pricingMode === "CategoryUnits" && <div><dt>کرایه پایه اقلام بدون تعرفه</dt><dd>{r.fee == null ? "اعلام هزینه موردی" : r.fee.toLocaleString("fa-IR") + " تومان"}</dd></div>}<div><dt>زمان تقریبی انتقال</dt><dd>{r.transitDays.toLocaleString('fa-IR')} روز</dd></div>{r.maxQuantity != null && <div><dt>سقف تعداد برای این کرایه</dt><dd>{r.maxQuantity.toLocaleString('fa-IR')} واحد فروش</dd></div>}</dl><div className="card-footer"><Button onClick={() => r.pricingMode === 'CategoryUnits' ? setTariffRoute(r) : editRoute(r, true)}>تعرفه دسته‌ها</Button><Button variant="secondary" onClick={() => editRoute(r)}><Pencil size={14} />ویرایش مسیر</Button></div></article>)}</div>
    {draft && <Modal title={draft.code ? 'ویرایش مسیر انتقال' : 'افزودن مسیر انتقال'} busy={busy} onClose={() => setDraft(null)}><form onSubmit={saveRoute}><div className="form-grid">
      <label>میدان مبدأ<select required value={draft.originCode} onChange={e => setDraft({ ...draft, originCode: e.target.value, destinationCode: e.target.value === draft.destinationCode ? '' : draft.destinationCode })}><option value="">انتخاب مبدأ</option>{points.data?.filter(p => p.isActive || p.code === draft.originCode).map(p => <option key={p.code} value={p.code}>{p.name}{!p.isActive ? ' (غیرفعال)' : ''}</option>)}</select></label>
      <label>میدان مقصد<select required value={draft.destinationCode} onChange={e => setDraft({ ...draft, destinationCode: e.target.value })}><option value="">انتخاب مقصد</option>{points.data?.filter(p => (p.isActive || p.code === draft.destinationCode) && p.code !== draft.originCode).map(p => <option key={p.code} value={p.code}>{p.name}{!p.isActive ? ' (غیرفعال)' : ''}</option>)}</select></label>
      <label className="check-line wide">
        <input type="checkbox" checked={draft.isBidirectional} onChange={e => setDraft({ ...draft, isBidirectional: e.target.checked })} />
        مسیر رفت‌وبرگشت با تعرفه و زمان یکسان
      </label>
      <label className="wide">روش محاسبه کرایه<select value={draft.pricingMode} onChange={e => setDraft({ ...draft, pricingMode: e.target.value as "Flat" | "CategoryUnits" })}><option value="Flat">کرایه ثابت یک محموله</option><option value="CategoryUnits">تعرفه بر اساس مقدار هر دسته‌بندی</option></select><small className="field-help">با «ذخیره و تنظیم تعرفه دسته‌ها» می‌توانید ظرفیت و قیمت هر واحد حمل را تعیین کنید.</small></label>
      <label>{draft.pricingMode === 'Flat' ? 'کرایه یک محموله (تومان)' : 'کرایه پایه اقلام بدون تعرفه (تومان)'}
        <MoneyInput value={draft.fee} onChange={value => setDraft({ ...draft, fee: value })} />
        <small className="field-help">{draft.pricingMode === 'CategoryUnits' && 'اگر هیچ تعرفه‌ای برای دسته یا والد آن پیدا نشود، این مبلغ یک‌بار برای مجموع اقلام بدون تعرفه در این مسیر محاسبه می‌شود. '}خالی یعنی اعلام هزینه موردی و صفر یعنی کرایه رایگان برای همین بخش.</small>
      </label><label>زمان تقریبی انتقال (روز)<input required type="number" min="1" max="30" value={draft.transitDays} onChange={e => setDraft({ ...draft, transitDays: e.target.value })} /></label>
      {draft.pricingMode === "Flat" && <details className="disclosure wide"><summary>سقف تعداد برای تعرفه ثابت (اختیاری)</summary><div className="disclosure-body"><label>حداکثر تعداد واحد فروش<input type="number" min="1" step="1" value={draft.maxQuantity} onChange={e => setDraft({ ...draft, maxQuantity: e.target.value })} /><small className="field-help">اگر تعداد بیشتر باشد، هزینه موردی تعیین می‌شود. تعداد به معنی وزن یا حجم بار نیست.</small></label></div></details>}<label className="check-line wide"><input type="checkbox" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />مسیر فعال و قابل انتخاب باشد</label>
    </div>{error && <p role="alert" className="notice error-notice">{error}</p>}<div className="form-actions"><Button disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره مسیر'}</Button>{draft.pricingMode === 'CategoryUnits' && <Button variant="secondary" disabled={busy} value="tariffs">ذخیره و تنظیم تعرفه دسته‌ها</Button>}<Button type="button" variant="secondary" disabled={busy} onClick={() => setDraft(null)}>انصراف</Button></div></form></Modal>}
    {tariffRoute && <RouteCategoryTariffs route={tariffRoute} onClose={() => setTariffRoute(undefined)} onChange={() => { void q.refetch(); }} />}
    {increaseOpen && <TariffIncrease onClose={() => setIncreaseOpen(false)} onChange={() => { void q.refetch(); }} />}
  </div>;
}
