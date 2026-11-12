import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MapPin, Navigation, Search } from 'lucide-react';
import { request } from '../../shared/api/client';
import { number } from '../../shared/utils/labels';
import Button from '../atoms/Button';
import ErrorState from './ErrorState';

type Address = { province: string; county: string; city?: string; village?: string; street: string; hasCoordinates: boolean; latitude?: number; longitude?: number; isDefault: boolean };
type Candidate = { code: string; fullName: string; userName: string; phoneNumber: string; address?: Address; distanceKm: number | null; regionRank: number; isAssigned: boolean };
type Result = { destination?: Address; destinationLabel: string; assignedCode?: string; totalCount: number; items: Candidate[] };
const addressText = (address?: Address) => address ? [address.province, address.county, address.city || address.village, address.street].filter(Boolean).join('، ') : 'نشانی ثبت نشده';
const mapUrl = (address: Address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.latitude},${address.longitude}`)}`;
const defaults = { search: '', scope: 'all', radiusKm: '', onlyLocated: false };

export default function NearbyAssigneePicker({ kind, code, name, value, required, onChange }: {
  kind: string; code: string; name: string; value: string; required: boolean; onChange: (code: string) => void;
}) {
  const [draft, setDraft] = useState(defaults);
  const [filters, setFilters] = useState(defaults);
  const [page, setPage] = useState(1);
  const [context, setContext] = useState<Result>();
  const [filterError, setFilterError] = useState('');
  const [selected, setSelected] = useState<Candidate>();
  const query = useQuery<Result>({
    queryKey: ['assignment-candidates', kind, code, filters, page],
    queryFn: ({ signal }) => request('/Admin/AssignmentCandidates', 'GET', undefined, { kind, code, ...filters, pageNumber: page, pageSize: 10 }, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
  useEffect(() => { if (query.data && !query.isPlaceholderData) setContext(query.data); }, [query.data, query.isPlaceholderData]);
  const destination = context?.destination;
  const applyFilters = () => {
    if (draft.radiusKm && (!Number.isFinite(Number(draft.radiusKm)) || Number(draft.radiusKm) < 0.1 || Number(draft.radiusKm) > 20000)) {
      setFilterError('شعاع باید عددی بین ۰٫۱ تا ۲۰٬۰۰۰ کیلومتر باشد'); return;
    }
    setFilterError(''); setFilters({ ...draft }); setPage(1);
  };
  const title = kind === 'ServiceRequest'  ? 'ارائه‌دهنده خدمات' : 'کارشناس ارزیابی';
  return <section className="field wide assignment-picker" aria-label={`انتخاب ${title} نزدیک`}>
    <label htmlFor={name}>{title}{required && <span className="required"> *</span>}</label>
    <div className="assignment-selection">
      <select id={name} aria-label={title} value={value || ''} required={required} onChange={() => {}}><option value="">از فهرست افراد واجد نقش انتخاب کنید</option>{value && <option value={value}>{selected?.code === value ? selected.fullName || selected.userName : value}</option>}</select>
      {value && <p>{selected?.code === value ? selected.fullName || selected.userName : 'کد انتخاب‌شده: ' + value}؛ تخصیص با «ثبت عملیات» ذخیره می‌شود.</p>}
    </div>
    <div className="assignment-destination">
      <MapPin size={20} aria-hidden="true" />
      <div><strong>{context?.destinationLabel || 'محل انجام کار'}</strong><p>{addressText(destination)}</p>
        {destination?.hasCoordinates ? <a href={mapUrl(destination)} target="_blank" rel="noreferrer">مشاهده مقصد روی نقشه</a> : <p className="assignment-warning">مختصات مقصد ثبت نشده؛ مقایسه بر اساس استان و شهرستان انجام می‌شود.</p>}
      </div>
    </div>
    <p className="assignment-help">مبنای فاصله، نشانی پیش‌فرض فرد است؛ اگر نداشته باشد اولین نشانی او استفاده می‌شود. فاصله به‌صورت مستقیم است و زمان رانندگی یا موقعیت زنده نیست.</p>
    <div className="assignment-filters" onKeyDown={event => {
      if (event.key === 'Enter' && event.target instanceof HTMLInputElement) { event.preventDefault(); if (!query.isFetching) applyFilters(); }
    }}>
      <label>نام، موبایل یا نام کاربری<input aria-label="جست‌وجوی فرد مناسب" value={draft.search} maxLength={100} onChange={e => setDraft({ ...draft, search: e.target.value })} /></label>
      <label>محدوده<select aria-label="محدوده جغرافیایی" value={draft.scope} onChange={e => setDraft({ ...draft, scope: e.target.value })}>
        <option value="all">همه مناطق</option><option value="province" disabled={!destination}>استان مقصد</option><option value="county" disabled={!destination}>شهرستان مقصد</option>
      </select></label>
      <label>شعاع تا مقصد (کیلومتر)<input aria-label="شعاع تا مقصد" type="number" min="0.1" max="20000" step="0.1" disabled={!destination?.hasCoordinates} value={draft.radiusKm} placeholder="بدون محدودیت" onChange={e => setDraft({ ...draft, radiusKm: e.target.value })} /></label>
      <label className="assignment-checkbox"><input type="checkbox" checked={draft.onlyLocated} onChange={e => setDraft({ ...draft, onlyLocated: e.target.checked })} />فقط افراد با مختصات ثبت‌شده</label>
    </div>
    <div className="toolbar">
      <Button type="button" variant="secondary" disabled={query.isFetching} onClick={applyFilters}><Search size={16} />اعمال فیلتر افراد</Button>
      <Button type="button" variant="ghost" onClick={() => { setDraft(defaults); setFilters(defaults); setPage(1); setFilterError(''); }}>پاک‌کردن فیلتر افراد</Button>
    </div>
    {filterError && <p role="alert" className="assignment-warning">{filterError}</p>}
    {query.isFetching && <p role="status">در حال یافتن افراد مناسب…</p>}
    {query.error && <><ErrorState error={query.error} /><Button type="button" variant="secondary" onClick={() => query.refetch()}>تلاش دوباره برای یافتن افراد</Button></>}
    {!query.isFetching && !query.error && query.data && <>
      <p className="assignment-help">{number(query.data.totalCount)} فرد واجد نقش؛ افراد دارای فاصله مشخص از نزدیک به دور، سپس افراد بدون فاصله بر اساس منطقه مرتب می‌شوند.</p>
      {!query.data.items.length && <p className="assignment-empty">فردی با این شرایط پیدا نشد. محدوده یا شعاع را بیشتر کنید؛ نقش و نشانی افراد را هم بررسی کنید.</p>}
    </>}
    {!query.error && <div className="assignment-results" aria-busy={query.isFetching}>
      {query.data?.items.map(person => <article key={person.code} className={`assignment-person ${value === person.code ? 'selected' : ''}`}>
        <div className="assignment-person-head"><strong>{person.fullName || person.userName}</strong><span className="badge">{person.distanceKm != null ? `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(person.distanceKm)} کیلومتر` : 'فاصله نامشخص'}</span></div>
        <p>{addressText(person.address)}</p>
        <small>{person.address ? person.address.isDefault ? 'نشانی پیش‌فرض' : 'اولین نشانی ذخیره‌شده' : 'بدون نشانی'}{person.regionRank === 0 ? ' · شهر یا روستای مقصد' : person.regionRank === 1 ? ' · شهرستان مقصد' : person.regionRank === 2 ? ' · استان مقصد' : ''}</small>
        <div className="assignment-person-actions"><span dir="ltr">{person.phoneNumber}</span>
          {person.address?.hasCoordinates && <a href={mapUrl(person.address)} target="_blank" rel="noreferrer"><Navigation size={14} />نقشه فرد</a>}
          <Button type="button" variant={value === person.code ? 'primary' : 'secondary'} disabled={query.isFetching} onClick={() => { setSelected(person); onChange(person.code); }}>{value === person.code ? 'انتخاب‌شده' : 'انتخاب این فرد'}</Button>
        </div>
        {person.isAssigned && <small className="green-text">این فرد در حال حاضر به درخواست تخصیص دارد.</small>}
      </article>)}
    </div>}
    {(query.data?.totalCount || 0) > 10 && <div className="toolbar">
      <Button type="button" variant="secondary" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>افراد قبلی</Button>
      <span>صفحه {number(page)}</span><Button type="button" variant="secondary" disabled={page * 10 >= (query.data?.totalCount || 0) || query.isFetching} onClick={() => setPage(page + 1)}>افراد بعدی</Button>
    </div>}
  </section>;
}
