import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request } from '../shared/api/client';
import { saleUnitLabel } from '../shared/utils/sale-units';
import type { DeliveryRoute } from '../shared/types/delivery';
import Button from '../design-system/atoms/Button';
import Modal from '../design-system/molecules/Modal';
import MoneyInput from '../design-system/molecules/MoneyInput';
import ErrorState from '../design-system/molecules/ErrorState';

type Category = { code: string; name: string };
type Tariff = { code: string; categoryCode: string; name: string; saleUnit: string; blockSize: number; pricePerBlock: number; needsReview: boolean };
const money = (value: number) => value.toLocaleString('fa-IR') + ' تومان';

export function RouteCategoryTariffs({ route, onClose, onChange }: { route: DeliveryRoute; onClose: () => void; onChange: () => void }) {
  const path = '/Delivery/Routes/' + encodeURIComponent(route.code);
  const q = useQuery<Tariff[]>({ queryKey: ['delivery-tariffs', route.code], queryFn: () => request(path + '/Tariffs') });
  const [search, setSearch] = useState(''), [term, setTerm] = useState('');
  useEffect(() => { const timer = setTimeout(() => setTerm(search.trim()), 350); return () => clearTimeout(timer); }, [search]);
  const categories = useQuery<Category[]>({ queryKey: ['tariff-categories', route.code, term], queryFn: ({ signal }) => request(path + '/TariffCategories', 'GET', undefined, { search: term }, signal) });
  const [category, setCategory] = useState<Category>();
  const [saleUnit, setSaleUnit] = useState("Kilogram");
  const [size, setSize] = useState('50'), [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [remove, setRemove] = useState<Tariff>();
  const [editingKey, setEditingKey] = useState<string>();
  const refresh = async () => { await q.refetch(); onChange(); };
  return <Modal title={`تعرفه دسته‌بندی‌ها: ${route.originName} ${route.isBidirectional ? "↔" : "←"} ${route.destinationName}`} busy={busy} onClose={onClose}>
    <div className="page-stack">
      <div className="guide-box"><div><strong>هر دسته و واحد فروش، ظرفیت و قیمت مستقل دارد.</strong><p>مثلاً هر ۵۰ کیلوگرم یک واحد: ۶۰ تا ۱۰۰ کیلوگرم دو واحد و ۱۰۱ کیلوگرم سه واحد است. برای بسته، مقدار پیشنهادی ۲۰ بسته و برای عدد، ۱ عدد است؛ می‌توانید تغییر دهید. محصولات با تعرفه یکسان در همان مسیر جمع می‌شوند و مقدار نهایی رو به بالا گرد می‌شود.</p><p>تعرفه زیر‌دسته بر دسته اصلی مقدم است. اگر زیر‌دسته تعرفه نداشته باشد، نزدیک‌ترین تعرفه والد انتخاب می‌شود. اگر هیچ تعرفه‌ای پیدا نشود، کرایه پایه مسیر اعمال می‌شود. دو شاخه هم‌سطح با تعرفه‌های متفاوت، نیاز به بررسی دارند. درجه‌های یک، دو و سه را به‌صورت زیر‌دسته تعریف کنید.</p></div></div>
      <form className="form-grid" onSubmit={e => { e.preventDefault(); if (busy || !category) return; setBusy(true); setError(''); void request(path + '/Tariffs', 'PUT', { categoryCode: category.code, saleUnit, blockSize: Number(size), pricePerBlock: Number(price) }).then(async () => { await refresh(); setCategory(undefined); setEditingKey(undefined); setPrice(''); }).catch(e => setError(e.message)).finally(() => setBusy(false)); }}>
        <label className="wide">جست‌وجوی دسته‌بندی<input disabled={!!editingKey} value={search} onChange={e => setSearch(e.target.value)} placeholder="نام دسته، زیر‌دسته یا درجه" /><small className="field-help">مثلاً گل شاخه‌ای / رز / درجه یک. تعرفه هر مسیر جدا است.</small></label>
        <label className="wide">دسته‌بندی<select required disabled={busy || categories.isLoading || !!editingKey} value={category?.code ?? ''} onChange={e => { const next = categories.data?.find(p => p.code === e.target.value); setCategory(next); setPrice(''); }}><option value="">انتخاب دسته‌بندی</option>{category && !categories.data?.some(p => p.code === category.code) && <option value={category.code}>{category.name}</option>}{categories.data?.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></label>
        <label>واحد فروش<select disabled={!!editingKey} value={saleUnit} onChange={e => { const unit = e.target.value; setSaleUnit(unit); setSize(unit === "Package" ? "20" : unit === "Piece" ? "1" : "50"); setPrice(''); }}><option value="Kilogram">کیلوگرم</option><option value="Package">بسته</option><option value="Piece">عدد</option></select></label>
        <label>مقدار هر واحد حمل ({saleUnitLabel(saleUnit)})<input required type="number" min="1" max="2147483647" step="1" value={size} onChange={e => setSize(e.target.value)} /></label>
        <label>قیمت هر واحد حمل (تومان)<MoneyInput required value={price} onChange={setPrice} /><small className="field-help">صفر یعنی حمل رایگان برای این دسته و واحد فروش.</small></label>
        <div className="form-actions wide"><Button disabled={busy || !category || price === ''}>{busy ? 'در حال ذخیره…' : 'ذخیره تعرفه دسته‌بندی'}</Button>{editingKey && <Button type="button" variant="secondary" disabled={busy} onClick={() => { setEditingKey(undefined); setCategory(undefined); setPrice(''); }}>انصراف از ویرایش</Button>}</div>
      </form>
      {(q.error || categories.error) && <ErrorState error={(q.error || categories.error)!} retry={() => { void q.refetch(); void categories.refetch(); }} />}
      {q.isLoading && <p>در حال دریافت تعرفه‌ها…</p>}
      {q.data?.length === 0 && <p className="empty">تعرفه‌ای ثبت نشده است؛ اولین دسته‌بندی را انتخاب کنید.</p>}
      <div className="page-stack">{q.data?.map(t => <article className="record-card" key={t.code}><strong>{t.name}</strong><p>هر {t.blockSize.toLocaleString('fa-IR')} {saleUnitLabel(t.saleUnit)}: {money(t.pricePerBlock)}</p>{t.needsReview && <p role="alert" className="red-text">دسته‌بندی حذف شده است؛ تعرفه را بررسی کنید.</p>}<div className="form-actions"><Button type="button" variant="secondary" disabled={busy} onClick={() => { setEditingKey(t.code); setCategory({ code: t.categoryCode, name: t.name }); setSaleUnit(t.saleUnit); setSize(String(t.blockSize)); setPrice(String(t.pricePerBlock)); setRemove(undefined); }}>ویرایش</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => setRemove(t)}>حذف تعرفه</Button></div></article>)}</div>
      {remove && <div className="notice"><p>تعرفهٔ «{remove.name}» حذف شود؟ استعلام‌های جدید از تعرفه والد استفاده می‌کنند؛ در نبود آن، کرایه پایه مسیر به کار می‌رود. اگر کرایه پایه خالی باشد، هزینه موردی تعیین می‌شود.</p><div className="form-actions"><Button type="button" disabled={busy} onClick={() => { setBusy(true); setError(''); void request(path + '/Tariffs/' + encodeURIComponent(remove.categoryCode) + '/' + encodeURIComponent(remove.saleUnit), 'DELETE').then(async () => { await refresh(); setRemove(undefined); }).catch(e => setError(e.message)).finally(() => setBusy(false)); }}>تأیید حذف</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => setRemove(undefined)}>انصراف</Button></div></div>}
      {error && <p role="alert" className="notice error-notice">{error}</p>}
    </div>
  </Modal>;
}

type Preview = { token: string; count: number; flatCount: number; baseCount?: number; categoryCount: number; items: { code: string; kind: string; route: string; category: string; oldPrice: number; newPrice: number }[] };
export function TariffIncrease({ onClose, onChange }: { onClose: () => void; onChange: () => void }) {
  const [percent, setPercent] = useState('10'), [preview, setPreview] = useState<Preview>();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <Modal title="افزایش درصدی همه تعرفه‌های حمل" busy={busy} onClose={onClose}><form className="page-stack" onSubmit={e => { e.preventDefault(); if (busy) return; setBusy(true); setError(''); setPreview(undefined); void request('/Delivery/Tariffs/Increase/Preview', 'POST', { percent: Number(percent) }).then(setPreview).catch(e => setError(e.message)).finally(() => setBusy(false)); }}>
    <p>قیمت هر واحد حمل دسته‌بندی‌ها در همه مسیرها و کرایه‌های ثابت و پایه افزایش می‌یابد؛ مسیرهای غیرفعال هم شامل می‌شوند. مبلغ جدید رو به بالا به تومان کامل گرد می‌شود. قیمت فروش کالا و هزینه ثبت‌شده سفارش‌ها تغییری نمی‌کند.</p>
    <label>درصد افزایش<input type="number" required min="0.01" max="1000" step="0.01" value={percent} onChange={e => { setPercent(e.target.value); setPreview(undefined); }} /></label><Button disabled={busy}>{busy ? 'در حال بررسی…' : 'پیش‌نمایش افزایش'}</Button>
    {preview && <><p>{preview.categoryCount.toLocaleString('fa-IR')} تعرفه دسته‌بندی و {preview.flatCount.toLocaleString('fa-IR')} کرایه ثابت و {(preview.baseCount ?? 0).toLocaleString('fa-IR')} کرایه پایه</p><div className="page-stack">{preview.items.map(item => <div key={item.kind + item.code} className="record-card"><strong>{item.category}</strong><p>{item.route}</p><p>{money(item.oldPrice)} ← {money(item.newPrice)}</p></div>)}</div>{preview.count > preview.items.length && <p>۱۰۰ مورد اول نمایش داده شده؛ افزایش روی هر {preview.count.toLocaleString('fa-IR')} تعرفه اعمال می‌شود.</p>}<Button type="button" disabled={busy || !preview.count} onClick={() => { setBusy(true); setError(''); void request('/Delivery/Tariffs/Increase/Apply', 'POST', { percent: Number(percent), expectedToken: preview.token }).then(() => { onChange(); onClose(); }).catch(e => { setError(e.message); setPreview(undefined); }).finally(() => setBusy(false)); }}>تأیید افزایش {percent}٪ برای همه {preview.count.toLocaleString('fa-IR')} تعرفه</Button></>}
    {error && <p role="alert" className="notice error-notice">{error}</p>}
  </form></Modal>;
}
