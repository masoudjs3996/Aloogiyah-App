import { CheckCircle2, Info, Settings } from 'lucide-react';
import { useLookups } from '../hooks/useLookups';
import { API_BASE } from '../shared/api/client';
import ErrorState from '../design-system/molecules/ErrorState';
import PageIntro from '../design-system/molecules/PageIntro';
import DataTable from '../design-system/organisms/DataTable';

export default function SettingsPage() {
  const q = useLookups();
  return <div className="page-stack"><PageIntro eyebrow="سیستم" title="تنظیمات و اطلاعات پایه" description="وضعیت اتصال و نقش‌های موجود را بررسی کنید. کارهای روزمره از منوی بخش مربوط انجام می‌شوند." />
    {q.error && <ErrorState error={q.error} retry={() => void q.refetch()} />}
    <section className="panel panel-pad"><div className="section-head"><h2 className="inline-icon"><Settings size={19} />وضعیت پنل</h2><span className={'badge ' + (q.isSuccess ? 'green' : '')}>{q.isSuccess ? 'اطلاعات پایه دریافت شده' : q.isLoading ? 'در حال بررسی' : 'نیازمند بررسی اتصال'}</span></div><div className="guide-box"><Info size={20} /><div><strong>برای تنظیم میدان و کرایه، از بخش تحویل استفاده کنید.</strong><p>نقش کاربران در صفحه «کاربران»، تعرفه مسیرها در «میدان بار و تحویل» و نرخ کارمزد در «تسویه کشاورزان» مدیریت می‌شوند.</p></div></div>{q.isSuccess && <p className="status-caption"><CheckCircle2 size={17} />نقش‌ها و وضعیت‌ها از سرور فعلی خوانده می‌شوند.</p>}</section>
    <details className="panel settlement-section"><summary>نشانی اتصال سرور</summary><div className="panel-pad"><p className="code" style={{ overflowWrap: 'anywhere' }}>{API_BASE}</p><p className="subtle">تغییر این نشانی هنگام تنظیم و انتشار پنل انجام می‌شود.</p></div></details>
    <details className="panel settlement-section"><summary>نقش‌های موجود ({q.data?.roles.length.toLocaleString('fa-IR') ?? '…'})</summary><DataTable rows={q.data?.roles ?? []} columns={['code', 'name', 'description']} /></details>
    <details className="panel settlement-section"><summary>فهرست وضعیت‌ها و شناسه‌ها</summary><DataTable rows={q.data?.statuses ?? []} columns={['code', 'name', 'entityStatus']} /></details>
  </div>;
}
