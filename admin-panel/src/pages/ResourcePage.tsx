import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Filter, Plus, RefreshCw, Search, Eye, Check, X, MoreHorizontal, Package, Info } from 'lucide-react';
import { execute, ApiError } from '../shared/api/client';
import { collection, csv } from '../shared/utils/contracts.mjs';
import { listEndpoint, resourceEndpoints, detailEndpoint, actionTitle } from '../features/resources';
import type { Resource, Row, Endpoint } from '../shared/types';
import { number } from '../shared/utils/labels';
import { availableActions } from '../shared/utils/resource-actions';
import { useAuth } from '../hooks/useAuth';
import { useLookups } from '../hooks/useLookups';
import Button from '../design-system/atoms/Button';
import Badge from '../design-system/atoms/Badge';
import PageIntro from '../design-system/molecules/PageIntro';
import ErrorState from '../design-system/molecules/ErrorState';
import FormField from '../design-system/molecules/FormField';
import ActionForm from '../design-system/organisms/ActionForm';
import ModerationForm from '../design-system/organisms/ModerationForm';
import RecordDetail from '../design-system/organisms/RecordDetail';
import DataTable from '../design-system/organisms/DataTable';
const viewTitles: Row = { GetUserByFilter: 'همه کاربران', GetActive: 'موارد فعال', GetFiles: 'فایل‌ها', MyNotifications: 'اعلان‌های حساب شما', MyWallet: 'کیف پول حساب شما', GetMyProfile: 'پروفایل حساب شما', GetRole: 'نقش حساب شما', GenerateCode: 'دریافت کد', DateTimeNow: 'زمان جاری', GetByFilter: 'همه موارد', GetByfilter: 'همه موارد', GetMyFarm: 'گلخانه‌های حساب مدیریت', GetTreeComments: 'نظرات تأییدشده به‌صورت درختی', CategoryTree: 'درخت دسته‌بندی‌ها', GetCategoriesByType: 'دسته‌ها بر اساس نوع', Provinces: 'استان‌ها', Counties: 'شهرستان‌ها', CityAndVillage: 'شهرها و روستاها', GetConversation: 'یک گفتگو', GetSimilar: 'محصولات مشابه' };
export default function ResourcePage({ resource: r }: { resource: Resource }) {
  const [view, setView] = useState(''), [filters, setFilters] = useState<Row>({ ...r.defaults }), [draft, setDraft] = useState<Row>({ ...r.defaults }), [page, setPage] = useState(1), [pageSize, setPageSize] = useState(20), [openFilter, setOpenFilter] = useState(false), [localSearch, setLocalSearch] = useState(''), [lookupCode, setLookupCode] = useState('');
  const [action, setAction] = useState<{ endpoint: Endpoint; record?: Row } | null>(null), [detail, setDetail] = useState<Row | null>(null), [moderation, setModeration] = useState<{ record: Row; decision: 'Approve' | 'Reject' } | null>(null), [opening, setOpening] = useState(false);
  const { user } = useAuth(), lookups = useLookups();
  const listViews = resourceEndpoints(r).filter(e => e.method === 'GET' && (e.id === listEndpoint(r)?.id || /^(GetBy[Ff]ilter|GetUserByFilter|GetActive|GetFiles|GetMyFarm|GetTreeComments|CategoryTree|GetCategoriesByType|Provinces|Counties|CityAndVillage|GetConversation|GetSimilar|MyNotifications)$/.test(e.action)));
  const endpoint = listViews.find(e => e.id === view) || listEndpoint(r);
  const query = useQuery({ queryKey: ['resource', r.id, endpoint?.id, filters, page, pageSize], queryFn: async ({ signal }) => { if (!endpoint) return []; try { return await execute(endpoint, { ...filters, pageNumber: page, pageSize }, signal); } catch (e) { if (e instanceof ApiError && e.status === 404 && /GetBy[Ff]ilter|GetFiles|GetActive/.test(endpoint.action) && !e.details && /پیدا نشد|یافت نشد/.test(e.message)) return []; throw e; } }, enabled: !!endpoint });
  const data = collection(query.data, pageSize, r.id);
  const visible = useMemo(() => data.items.filter((row: Row) => !localSearch || Object.values(row).some(v => typeof v !== 'object' && String(v ?? '').toLowerCase().includes(localSearch.toLowerCase()))), [query.data, localSearch]);
  const operations = resourceEndpoints(r).filter(e => e.method !== 'GET' && (user?.roles.includes('Manager') || !e.roles.length || e.roles.some(role => user?.roles.includes(role))));
  const create = operations.filter(e => /Create|UploadFile|^Tariff$|^(Province|County|City|Village)$/.test(e.action)), rowActions = operations.filter(e => !create.includes(e));
  const columns = r.columns.filter(c => !data.items.length || data.items.some((row: Row) => c in row));
  const filterFields = endpoint?.query.filter(f => !['pageNumber', 'pageSize', 'sortColumn', 'sortDescending', 'view'].includes(f.name)) ?? [];
  const filterCount = Object.values(filters).filter(v => v !== '' && v != null).length;
  function exportPage() { const blob = new Blob([csv(visible, columns)], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = r.id + '-page-' + page + '.csv'; a.click(); URL.revokeObjectURL(url); }
  async function openAction(e: Endpoint, row: Row) {
    if (opening) return; setOpening(true);
    try {
      const full = (r.id === 'AgriculturalOrder' || (r.id === 'Farm' || r.id === 'Article') && e.method === 'PUT') && detailEndpoint(r) ? await execute(detailEndpoint(r)!, { code: row.code }) : row;
      if (!availableActions(r, [e], full).length) { toast.error('این عملیات برای وضعیت فعلی سفارش فعال نیست.'); await query.refetch(); return; }
      setAction({ endpoint: e, record: full });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'اطلاعات رکورد دریافت نشد.'); } finally { setOpening(false); }
  }
  function deliveryLink(row: Row) { return '/deliveries' + (row.checkoutCode ? '?checkout=' + encodeURIComponent(row.checkoutCode) : ''); }
  function actionsFor(row: Row) {
    const actions = availableActions(r, rowActions, row);
    return <><button className="text-button" aria-label={'جزئیات ' + row.code} onClick={() => setDetail(row)}><Eye size={15} />مشاهده</button>{r.id === 'Comment' && <><button className="icon-button green-text" title="تأیید نظر" aria-label="تأیید نظر" onClick={() => setModeration({ record: row, decision: 'Approve' })}><Check size={15} /></button><button className="icon-button red-text" title="رد نظر" aria-label="رد نظر" onClick={() => setModeration({ record: row, decision: 'Reject' })}><X size={15} /></button></>}
      {(actions.length > 0 || r.id === 'AgriculturalOrder') && <details className="row-menu"><summary><MoreHorizontal size={16} />عملیات</summary><div className="row-menu-list" onClick={e => { const target = e.target as HTMLElement; if (target.closest('button,a')) (e.currentTarget.parentElement as HTMLDetailsElement).open = false; }}>{r.id === 'AgriculturalOrder' && <Link to={deliveryLink(row)}>رسیدگی به ورود و تحویل بار</Link>}{actions.map(e => <button type="button" disabled={opening} className={e.method === 'DELETE' ? 'red-text' : ''} key={e.id} onClick={() => void openAction(e, row)}>{actionTitle(e)}</button>)}</div></details>}
    </>;
  }
  return <><PageIntro eyebrow={'مدیریت / ' + r.group} title={r.title} description={r.description} actions={<>{create.length === 1 ? <Button onClick={() => setAction({ endpoint: create[0] })}><Plus size={17} />{actionTitle(create[0])}</Button> : create.length > 1 && <details className="row-menu create-menu"><summary><Plus size={16} />ثبت جدید</summary><div className="row-menu-list">{create.map(e => <button key={e.id} onClick={event => { (event.currentTarget.closest('details') as HTMLDetailsElement).open = false; setAction({ endpoint: e }); }}>{({ Province: 'افزودن استان', County: 'افزودن شهرستان', City: 'افزودن شهر', Village: 'افزودن روستا' } as Row)[e.action] || actionTitle(e)}</button>)}</div></details>}<Button variant="secondary" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw size={16} />به‌روزرسانی</Button></>} />
    {r.id === 'AgriculturalOrder' && <div className="guide-box"><Package size={22} /><div><strong>برای ثبت رسیدن محصول یا کد خریدار، به بخش تحویل بروید.</strong><p>این فهرست برای بررسی وضعیت سفارش‌هاست. بازپرداخت فقط برای درخواست بازپرداخت فعال نمایش داده می‌شود.</p><Link className="text-button" to="/deliveries">رفتن به میدان بار و تحویل ←</Link></div></div>}
    {r.note && <details className="disclosure detail-section"><summary className="inline-icon"><Info size={16} />راهنمای این بخش</summary><div className="disclosure-body"><p className="subtle">{r.note}</p></div></details>}
    {detailEndpoint(r) && <div className="record-tools"><details><summary>کد دقیق را دارید؟ مشاهده مستقیم رکورد</summary><form className="code-lookup" onSubmit={e => { e.preventDefault(); setDetail({ code: lookupCode.trim() }); }}><input aria-label="کد برای مشاهده مستقیم" placeholder="کد رکورد" required maxLength={10} dir="ltr" value={lookupCode} onChange={e => setLookupCode(e.target.value)} /><Button variant="secondary"><Search size={15} />مشاهده با کد</Button></form></details></div>}
    <section className="panel">{listViews.length > 1 && <div className="view-picker"><label htmlFor="resource-list-view">نمایش</label><select id="resource-list-view" value={endpoint?.id} onChange={e => { setView(e.target.value); setFilters({ ...r.defaults }); setDraft({ ...r.defaults }); setPage(1); setOpenFilter(true); }}>{listViews.map(e => <option key={e.id} value={e.id}>{viewTitles[e.action] || e.action}</option>)}</select></div>}
      <div className="panel-toolbar"><div className="search"><Search size={17} /><input aria-label="جست‌وجو در صفحه" placeholder="جست‌وجو در همین صفحه…" value={localSearch} onChange={e => setLocalSearch(e.target.value)} /></div><div className="toolbar">{filterFields.length > 0 && <Button variant="secondary" aria-expanded={openFilter} aria-controls="resource-filters" onClick={() => setOpenFilter(!openFilter)}><Filter size={15} />فیلترها{filterCount > 0 && <Badge>{number(filterCount)}</Badge>}</Button>}<Button variant="ghost" onClick={exportPage} disabled={!visible.length}><Download size={15} />خروجی این صفحه</Button></div></div>
      {openFilter && filterFields.length > 0 && <form id="resource-filters" className="filters" onSubmit={e => { e.preventDefault(); setFilters({ ...draft }); setPage(1); }}><p className="filters-note">برای محدودکردن کل فهرست، فیلترهای لازم را پر کنید. پرکردن همه گزینه‌ها لازم نیست.</p><div className="form-grid">{filterFields.map(f => <FormField key={f.name} field={f} value={draft[f.name]} discountType={draft.discountType} filter resource={r} onChange={v => setDraft(d => ({ ...d, [f.name]: v }))} />)}</div><div className="toolbar"><Button>اعمال فیلترها</Button><Button variant="secondary" type="button" onClick={() => { setDraft({ ...r.defaults }); setFilters({ ...r.defaults }); setPage(1); }}>پاک‌کردن فیلترها</Button>{r.id === 'QualityAssessment' && <Button variant="secondary" type="button" onClick={() => { setDraft({ qualityGrade: 'PENDING' }); setFilters({ qualityGrade: 'PENDING' }); setPage(1); }}>در انتظار ارزیابی</Button>}{r.id === 'Comment' && <Button variant="secondary" type="button" onClick={() => { const code = lookups.data?.statuses.find(s => s.code === '288E5EC830')?.code; if (code) { setFilters({ statusCode: code }); setDraft({ statusCode: code }); setPage(1); } }}>در انتظار تأیید</Button>}</div></form>}
      {query.isLoading ? <div className="loading">در حال دریافت اطلاعات…</div> : query.error ? <ErrorState error={query.error} retry={() => void query.refetch()} /> : <DataTable rows={visible} columns={columns} statuses={lookups.data?.statuses} actions={actionsFor} />}
      <div className="pagination"><span>{data.total !== null ? number(data.total) + ' رکورد' : number(data.items.length) + ' رکورد در صفحه'} · صفحه {number(page)}{localSearch ? ` · ${number(visible.length)} نتیجه در همین صفحه` : ''}{query.isFetching ? ' · در حال دریافت…' : ''}</span><div className="toolbar"><select aria-label="تعداد رکورد" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>{[10, 20, 50, 100].map(n => <option key={n} value={n}>{number(n)} در صفحه</option>)}</select><Button variant="secondary" disabled={page === 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>قبلی</Button><Button variant="secondary" disabled={!data.hasNext || query.isFetching} onClick={() => setPage(p => p + 1)}>بعدی</Button></div></div>
    </section>
    {action && <ActionForm key={action.endpoint.id} endpoint={action.endpoint} resource={r} record={action.record} onClose={() => setAction(null)} />}
    {detail && <RecordDetail resource={r} record={detail} onClose={() => setDetail(null)} actions={row => <>{r.id === 'AgriculturalOrder' && <Link className="button primary" to={deliveryLink(row)}><Package size={16} />رسیدگی به تحویل بار</Link>}{availableActions(r, rowActions, row).map(e => <Button key={e.id} disabled={opening} variant={e.method === 'DELETE' ? 'danger' : 'secondary'} onClick={() => { setDetail(null); void openAction(e, row); }}>{actionTitle(e)}</Button>)}{r.id === 'Comment' && <><Button onClick={() => { setDetail(null); setModeration({ record: row, decision: 'Approve' }); }}>تأیید نظر</Button><Button variant="danger" onClick={() => { setDetail(null); setModeration({ record: row, decision: 'Reject' }); }}>رد نظر</Button></>}</>} />}
    {moderation && <ModerationForm {...moderation} onClose={() => setModeration(null)} />}
  </>;
}
