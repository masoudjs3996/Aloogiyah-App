import PageIntro from '../design-system/molecules/PageIntro';
import SectionTabs from '../design-system/molecules/SectionTabs';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request, downloadPrivate } from '../shared/api/client';
import { useAuth } from '../hooks/useAuth';
import Button from '../design-system/atoms/Button';
import { settlementStatuses, settlementActions, type Settlement, type SettlementPage } from '../shared/types/settlement';

const money = (n: number) => `${n.toLocaleString('fa-IR')} تومان`;
const date = (s: string | null) => s ? new Date(s.length === 10 ? s + 'T12:00:00+03:30' : s).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'medium' }) : '—';
type Rates = { commissionRate: number; taxRate: number; reason: string };

export default function SettlementsPage() {
  const { user } = useAuth(); const manager = user?.roles.includes('Manager'); const client = useQueryClient();
  const [tab, setTab] = useState<'requests' | 'rates' | 'calendar'>('requests');
  const [status, setStatus] = useState('Pending'), [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({}), [refs, setRefs] = useState<Record<string, string>>({});
  const [commission, setCommission] = useState(''), [tax, setTax] = useState(''), [reason, setReason] = useState('');
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [holidays, setHolidays] = useState(''), [confirmed, setConfirmed] = useState(false);
  const [dueOn, setDueOn] = useState(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tehran' }));
  const capabilities = useQuery({ queryKey: ['payment-capabilities'], enabled: tab === 'requests', queryFn: () => request('/Wallet/Capabilities') as Promise<{ onlinePaymentAvailable: boolean; automaticPayoutAvailable: boolean }> });
  const q = useQuery({ queryKey: ['settlements', status, page], enabled: tab === 'requests', queryFn: () => request('/Settlement/Manage', 'GET', undefined, { status, page }) as Promise<SettlementPage<Settlement>> });
  const rates = useQuery({ queryKey: ['settlement-rates'], enabled: tab === 'rates', queryFn: () => request('/Settlement/Rates') as Promise<Rates> });
  const calendar = useQuery({ queryKey: ['settlement-calendar', from, to], queryFn: () => request('/Settlement/Calendar', 'GET', undefined, { from, to }) as Promise<{ date: string; isClosed: boolean }[]>, enabled: tab === 'calendar' && !!from && !!to && from <= to });
  async function run(work: () => Promise<unknown>, message: string) {
    setBusy(true); setError(''); setSuccess('');
    try { await work(); await Promise.all([client.invalidateQueries({ queryKey: ['settlements'] }), client.invalidateQueries({ queryKey: ['settlement-rates'] }), client.invalidateQueries({ queryKey: ['settlement-calendar'] })]); setSuccess(message); }
    catch (e) { setError(e instanceof Error ? e.message : 'عملیات انجام نشد'); } finally { setBusy(false); }
  }
  function action(r: Settlement, action: string) { void run(() => request(`/Settlement/Requests/${encodeURIComponent(r.code)}/Actions`, 'POST', { action, note: notes[r.code], transferReference: refs[r.code] }), 'وضعیت درخواست ثبت شد.'); }
  return <div className="page-stack">
    <PageIntro eyebrow="امور مالی" title="تسویه کشاورزان" description="درخواست را بررسی کنید، حساب را تطبیق دهید و پس از انتقال واقعی وجه، رسید واریز را ثبت کنید." />
    <SectionTabs label="بخش‌های تسویه" value={tab} onChange={setTab} tabs={[{value:'requests',label:'درخواست‌های تسویه'},{value:'rates',label:'کارمزد و مالیات'},{value:'calendar',label:'تقویم و موعد پرداخت'}]} />
    {tab === 'requests' && <div className="guide-box"><div><strong>ترتیب رسیدگی: تطبیق حساب ← تأیید درخواست ← انتقال وجه ← ثبت رسید</strong><p>مهلت درخواست پنج‌شنبه پیش از ساعت ۱۲ تهران است. موعد پرداخت شنبه یا اولین روز کاری بعد است؛ ثبت رسید فقط پس از واریز واقعی انجام شود.</p></div></div>}
    {tab === 'requests' && <details className="panel settlement-section"><summary>فهرست واریز و وضعیت اتصال بانکی</summary><div className="panel-pad"><h2>وضعیت دریافت و واریز</h2><p>درگاه دریافت پول: {capabilities.data?.onlinePaymentAvailable ? 'فعال' : 'متصل نشده'} · انتقال خودکار بانکی: {capabilities.data?.automaticPayoutAvailable ? 'فعال' : 'متصل نشده'} · واریز فعلی: دستی با ثبت رسید</p>
      <div className="business-filters"><label>درخواست‌های تأییدشده با سررسید تا تاریخ<input type="date" value={dueOn} onChange={e => setDueOn(e.target.value)} /></label><Button variant="secondary" disabled={busy || !dueOn} onClick={() => void run(async () => {
        const blob = await downloadPrivate(`/Settlement/Export?dueOn=${encodeURIComponent(dueOn)}`);
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `settlements-${dueOn}.csv`;
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'فهرست واریز آماده شد؛ دریافت خروجی به معنی انجام واریز نیست.')}>دریافت فهرست واریز (CSV، تومان)</Button></div>
      <p>این فایل فهرست بررسی واریز است؛ قالب بارگذاری مستقیم بانک نیست و وضعیت درخواست‌ها را تغییر نمی‌دهد.</p>
    </div></details>}
    {error && <p role="alert" className="red-text">{error}</p>}{success && <p role="status" className="green-text">{success}</p>}
    {tab === 'rates' && rates.error && <p role="alert">{rates.error.message}</p>}
    {tab === 'rates' && <section className="panel business-detail"><h2>کارمزد و مالیات</h2><p>نرخ جاری: کارمزد {rates.data?.commissionRate ?? '—'}٪ · مالیات {rates.data?.taxRate ?? '—'}٪</p><p>هر دو نرخ بر مبلغ نهایی سفارش هنگام تأیید کشاورز محاسبه و از درآمد کسر می‌شوند. تغییر نرخ روی درآمدهای قبلی اثر ندارد. مدیر ارشد بالاترین دسترسی را دارد؛ ادمین و کارشناسان نمی‌توانند نرخ‌ها را تغییر دهند.</p>
      {manager ? <form className="business-review" onSubmit={e => { e.preventDefault(); void run(async () => {
        if (commission.trim() === '' || tax.trim() === '' || !Number.isFinite(Number(commission)) || !Number.isFinite(Number(tax))) throw new Error('هر دو نرخ را وارد کنید.');
        await request('/Settlement/Rates', 'PUT', { commissionRate: Number(commission), taxRate: Number(tax), reason });
      }, 'نرخ‌های جدید برای تأیید سفارش‌های بعدی ثبت شدند.'); }}>
        <label>کارمزد (درصد)<input required type="number" min="0" max="100" step="0.0001" value={commission} placeholder={String(rates.data?.commissionRate ?? 0)} onChange={e => setCommission(e.target.value)} /></label>
        <label>مالیات (درصد)<input required type="number" min="0" max="100" step="0.0001" value={tax} placeholder={String(rates.data?.taxRate ?? 0)} onChange={e => setTax(e.target.value)} /></label>
        <label>دلیل تغییر<textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label><Button disabled={busy}>ذخیره نرخ‌ها</Button>
      </form> : <p>تغییر نرخ‌ها فقط برای مدیر ارشد (Manager) مجاز است.</p>}
    </section>}
    {tab === 'calendar' && <section className="panel business-detail"><h2>تقویم تسویه و تعطیلات عمومی</h2><p>تاریخ‌ها را میلادی وارد کنید. جمعه خودکار تعطیل است. با ذخیره، تقویم این بازه جایگزین می‌شود و موعد درخواست‌های در صف دوباره محاسبه می‌شود.</p>
      <form className="business-review" onSubmit={e => { e.preventDefault(); void run(() => request('/Settlement/Calendar', 'PUT', { from, to, holidays: holidays.split(/[\s,،]+/).filter(Boolean) }), 'تقویم و موعد درخواست‌های در صف به‌روزرسانی شدند.'); }}>
        <label>از تاریخ<input required type="date" value={from} onChange={e => { setFrom(e.target.value); setConfirmed(false); }} /></label><label>تا تاریخ<input required type="date" value={to} onChange={e => { setTo(e.target.value); setConfirmed(false); }} /></label>
        {calendar.error && <p role="alert">{calendar.error.message}</p>}
        {calendar.data && <p>روزهای تأییدشده: {calendar.data.length} · روزهای تعطیل ثبت‌شده: {calendar.data.filter(d => d.isClosed).map(d => d.date).join('، ') || 'ندارد'}</p>}
        <label>فهرست کامل تعطیلات عمومی این بازه (YYYY-MM-DD، با فاصله یا خط جدید)<textarea value={holidays} onChange={e => { setHolidays(e.target.value); setConfirmed(false); }} /></label>
        <label><span><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> تقویم رسمی این بازه را بررسی کردم و فهرست کامل تعطیلات را وارد کرده‌ام.</span></label>
        <Button disabled={busy || !confirmed}>تأیید و ذخیره تقویم</Button>
      </form>
    </section>}
    {tab === 'requests' && <><div className="business-filters"><label>وضعیت درخواست<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">همه</option>{Object.entries(settlementStatuses).map(([v, title]) => <option key={v} value={v}>{title}</option>)}</select></label><Button variant="secondary" disabled={busy} onClick={() => void q.refetch()}>به‌روزرسانی</Button></div>
    {q.isLoading && <p>در حال دریافت درخواست‌ها…</p>}{q.error && <p role="alert">{q.error.message}</p>}{q.data?.items.length === 0 && <p>درخواستی در این بخش نیست.</p>}
    {q.data?.items.map(r => <article key={r.code} className="panel business-detail"><div className="business-heading"><h2>{money(r.amount)}</h2><span className="badge">{settlementStatuses[r.status]}</span></div>
      <p>کد درخواست: {r.code} · ثبت: {date(r.createdAt)} · موعد: {r.scheduledDate ? date(r.scheduledDate) : "در انتظار تأیید تقویم"}</p><p>صاحب حساب: {r.accountHolder} · شبا: <span dir="ltr">{r.iban}</span></p>
      {r.paidAt && <p>واریز: {date(r.paidAt)} · شناسه: {r.transferReference}</p>}
      {!['Paid', 'Rejected', 'Cancelled'].includes(r.status) && <div className="business-review"><label>توضیح (برای تأیید، نتیجه تطبیق نام و شبا را بنویسید)<textarea maxLength={1000} value={notes[r.code] || ''} onChange={e => setNotes(n => ({ ...n, [r.code]: e.target.value }))} /></label>
        {r.status === 'Transferring' && <label>شناسه واریز واقعی<input maxLength={150} value={refs[r.code] || ''} onChange={e => setRefs(n => ({ ...n, [r.code]: e.target.value }))} /></label>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {r.status === 'Pending' && <Button disabled={busy || !notes[r.code]?.trim()} onClick={() => action(r, 'Approve')}>تطبیق حساب و تأیید درخواست</Button>}
          {r.status === 'Pending' && <Button variant="secondary" disabled={busy || !notes[r.code]?.trim()} onClick={() => action(r, 'Cancel')}>لغو درخواست و آزادسازی مبلغ</Button>}
          {['Pending', 'Approved'].includes(r.status) && <Button variant="danger" disabled={busy || !notes[r.code]?.trim()} onClick={() => action(r, 'Reject')}>رد درخواست و آزادسازی مبلغ</Button>}
          {r.status === 'Approved' && <Button disabled={busy} onClick={() => action(r, 'StartTransfer')}>شروع انتقال در موعد پرداخت</Button>}
          {r.status === 'Transferring' && <><Button disabled={busy || !refs[r.code]?.trim()} onClick={() => action(r, 'Pay')}>تأیید واریز واقعی با شناسه بالا</Button><Button variant="secondary" disabled={busy || !notes[r.code]?.trim()} onClick={() => action(r, 'Retry')}>شکست قطعی پس از استعلام؛ بازگشت به صف</Button></>}
        </div>
      </div>}
      <details><summary>سابقه درخواست</summary><ul className="business-history">{r.history.map((h, i) => <li key={i}>{settlementActions[h.action] || h.action}<small>{date(h.createdAt)}</small><p>{h.note}</p></li>)}</ul></details>
      {!!r.transferAttempts?.length && <details><summary>تلاش‌های انتقال وجه</summary><ul className="business-history">{r.transferAttempts.map(a => <li key={a.code}>کد تلاش: {a.code} · {a.status === 'Succeeded' ? 'واریز تأییدشده' : a.status === 'FailedConfirmed' ? 'شکست قطعی پس از استعلام' : 'در انتظار تأیید نتیجه'}<small>{date(a.createdAt)} · {money(a.amountToman)}</small><p>شناسه واریز: {a.providerReference || 'هنوز ثبت نشده'} · {a.resolutionNote}</p></li>)}</ul></details>}
    </article>)}
    <div style={{ display: 'flex', gap: 12 }}><Button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>قبلی</Button><span>صفحه {page}</span><Button disabled={!q.data || page * 20 >= q.data.totalCount} onClick={() => setPage(p => p + 1)}>بعدی</Button></div></>}
  </div>;
}
