import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpLeft, MessageSquare, Sprout, BadgeCheck, Users, Leaf, ShoppingBag, House, RefreshCw, Package, Receipt, ArrowLeft } from 'lucide-react';
import { request } from '../shared/api/client';
import { number } from '../shared/utils/labels';
import { useAuth } from '../hooks/useAuth';
import ErrorState from '../design-system/molecules/ErrorState';
import Button from '../design-system/atoms/Button';
import PageIntro from '../design-system/molecules/PageIntro';
const listingsMode = import.meta.env.VITE_MARKETPLACE_MODE !== 'Commerce';
const cards = listingsMode
  ? [{ key: 'pendingComments', title: 'نظر در انتظار تأیید', link: 'Comment', icon: MessageSquare, color: 'amber' }]
  : [{ key: 'pendingComments', title: 'نظر در انتظار تأیید', link: 'Comment', icon: MessageSquare, color: 'amber' }, { key: 'unassignedServices', title: 'خدمت بدون ارائه‌دهنده', link: 'ServiceRequest', icon: Sprout, color: 'green' }, { key: 'pendingQuality', title: 'ارزیابی در انتظار', link: 'QualityAssessment', icon: BadgeCheck, color: 'blue' }, { key: 'orders', title: 'کل سفارش‌های کشاورزی', link: 'AgriculturalOrder', icon: ShoppingBag, color: 'violet' }];
const work = listingsMode
  ? [{ to: '/product-types', title: 'نوع محصول و مشخصات', text: 'برای هر نوع محصول، گزینه‌های اجباری فرم آگهی را تعریف یا ویرایش کنید.', icon: Leaf }, { to: '/product-reports', title: 'رسیدگی به گزارش آگهی‌ها', text: 'گزارش‌های کاربران را بررسی کنید و در صورت نیاز آگهی را پیگیری کنید.', icon: MessageSquare }, { to: '/business-applications', title: 'بررسی درخواست‌های همکاری', text: 'مدارک متقاضی را ببینید و نتیجه بررسی را ثبت کنید.', icon: BadgeCheck }]
  : [{ to: '/deliveries', title: 'رسیدگی به بار و تحویل', text: 'ورود محصول به میدان، نوبت تحویل و ثبت کد خریدار.', icon: Package }, { to: '/business-applications', title: 'بررسی درخواست‌های همکاری', text: 'مدارک متقاضی را ببینید و نتیجه بررسی را ثبت کنید.', icon: BadgeCheck }, { to: '/settlements', title: 'تسویه با کشاورزان', text: 'درخواست‌ها، موعد واریز و ثبت رسید واقعی پرداخت.', icon: Receipt }];
export default function DashboardPage() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => request('/Admin/Dashboard'), refetchInterval: 60000 });
  return <><PageIntro eyebrow="نمای کلی مدیریت" title={'سلام ' + (user?.fName || 'مدیر') + '، خوش آمدید.'} description={listingsMode ? 'مدیریت آگهی‌ها، نوع محصول و رسیدگی به گزارش‌ها را از اینجا شروع کنید.' : 'کارهای روزمره را از اینجا شروع کنید؛ هر بخش، راهنمای قدم بعدی را دارد.'} actions={<Button variant="secondary" onClick={() => void q.refetch()} disabled={q.isFetching}><RefreshCw size={16} />به‌روزرسانی</Button>} />
    <section className="dashboard-work"><div className="section-head"><h2>امروز چه کاری دارید؟</h2></div><div className="workflow-links">{work.map(item => <Link className="workflow-link" key={item.to} to={item.to}><div><item.icon size={24} /><ArrowLeft size={17} /></div><strong>{item.title}</strong><p>{item.text}</p></Link>)}</div></section>
    {q.error ? <ErrorState error={q.error} retry={() => void q.refetch()} /> : <><div className="section-head"><h2>وضعیت رسیدگی</h2><span className="subtle">آمار ثبت‌شده در سامانه</span></div><div className="stats-grid">{cards.map(c => <Link key={c.key} to={'/manage/' + c.link} className="stat-card"><div className="stat-head"><span className={'stat-icon ' + c.color}><c.icon size={22} /></span><ArrowUpLeft size={17} /></div><strong>{q.isLoading ? '…' : number(q.data?.[c.key] ?? 0)}</strong><span>{c.title}</span></Link>)}</div>
      <div className="dashboard-columns"><section className="panel quick"><h2>صف رسیدگی</h2>{cards.slice(0, 3).map(c => <Link key={c.key} to={'/manage/' + c.link}><c.icon size={19} /><span>{c.title}</span><b>{q.isLoading ? '…' : number(q.data?.[c.key] ?? 0)}</b><ArrowUpLeft size={16} /></Link>)}</section><section className="panel quick"><h2>{listingsMode ? 'آگهی‌ها و کاربران' : 'فروشگاه و کاربران'}</h2>{[{ key: 'users', title: 'کاربران ثبت‌شده', icon: Users, id: 'User' }, { key: 'farms', title: 'گلخانه‌ها', icon: House, id: 'Farm' }, { key: 'products', title: 'آگهی‌های کشاورزی', icon: Leaf, id: 'AgriculturalProduct' }].map(c => <Link key={c.key} to={'/manage/' + c.id}><c.icon size={19} /><span>{c.title}</span><b>{q.isLoading ? '…' : number(q.data?.[c.key] ?? 0)}</b><ArrowUpLeft size={16} /></Link>)}</section></div><p className="updated detail-section">آخرین دریافت: {q.data?.updatedAt ? new Date(q.data.updatedAt).toLocaleString('fa-IR') : '—'} · به‌روزرسانی خودکار هر یک دقیقه</p>
    </>}
  </>;
}
