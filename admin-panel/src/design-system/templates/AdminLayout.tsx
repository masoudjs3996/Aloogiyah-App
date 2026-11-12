import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Leaf, Search, LayoutDashboard, Settings, Menu, LogOut, ChevronDown, ChevronLeft, Package, BadgeCheck, Receipt, ShoppingBag, Circle, Users, House, Layers, FileText, Bell, Sprout, MessageSquare, Gavel, TicketPercent, Warehouse, Boxes, ShoppingCart, Image, MessagesSquare, Files, History, MapPin, ShieldCheck } from 'lucide-react';
import { resources } from '../../features/resource-list';
import { useAuth } from '../../hooks/useAuth';
import { useLookups } from '../../hooks/useLookups';

const icons = { Leaf, Package, Circle, Users, House, Layers, FileText, Bell, Sprout, MessageSquare, BadgeCheck, ShoppingBag, Gavel, TicketPercent, Warehouse, Boxes, ShoppingCart, Image, MessagesSquare, Files, History, MapPin };
const listingsMode = import.meta.env.VITE_MARKETPLACE_MODE !== 'Commerce';
const listingHiddenResources = new Set(['ServiceRequest', 'QualityAssessment', 'AgriculturalOrder', 'Product', 'Auction', 'AuctionBid', 'Discount', 'Warehouse', 'WarehouseInventory', 'Order']);
const work = [
  { path: '/product-types', title: 'نوع محصول و مشخصات آگهی', icon: Layers },
  { path: '/business-applications', title: 'درخواست‌های همکاری', icon: BadgeCheck },
  { path: '/product-reports', title: 'گزارش آگهی‌ها و پیام‌ها', icon: ShieldCheck },
  ...(!listingsMode ? [{ path: '/deliveries', title: 'میدان بار و تحویل', icon: Package }, { path: '/manage/AgriculturalOrder', title: 'سفارش‌های کشاورزی', icon: ShoppingBag }, { path: '/settlements', title: 'تسویه کشاورزان', icon: Receipt }] : []),
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false), [search, setSearch] = useState('');
  const { user, logout } = useAuth(); const lookups = useLookups(); const location = useLocation();
  const [expanded, setExpanded] = useState<string[]>([]);
  const currentResource = resources.find(r => location.pathname === '/manage/' + r.id);
  const title = work.find(r => r.path === location.pathname)?.title ?? currentResource?.title ?? ({ '/': 'داشبورد', '/checkout': 'بررسی خرید', '/settings': 'تنظیمات' } as Record<string, string>)[location.pathname] ?? 'پنل مدیریت';
  useEffect(() => { setOpen(false); if (currentResource) setExpanded(x => x.includes(currentResource.group) ? x : [...x, currentResource.group]); }, [location.pathname, currentResource]);
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [open]);
  const matches = (text: string) => text.includes(search.trim());
  return <div className="admin-shell">
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>رفتن به محتوای صفحه</a>
    {open && <button aria-label="بستن منو" className="sidebar-scrim" onClick={() => setOpen(false)} />}
    <aside id="admin-sidebar" className={'sidebar ' + (open ? 'open' : '')}>
      <NavLink to="/" className="brand"><span><Leaf size={25} /></span><div><b>الوگیاه</b><small>فضای مدیریت</small></div></NavLink>
      <div className="sidebar-search"><Search size={17} /><input aria-label="جست‌وجوی بخش‌های پنل" placeholder="دنبال چه بخشی هستید؟" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <nav aria-label="بخش‌های مدیریت">
        {matches('داشبورد') && <NavLink to="/" end><LayoutDashboard size={19} />داشبورد</NavLink>}
        <small className="nav-group">کارهای روزمره</small>
        {work.filter(r => matches(r.title)).map(r => <NavLink key={r.path} to={r.path}><r.icon size={19} />{r.title}</NavLink>)}
        {['رسیدگی', 'مدیریت', 'فروشگاه', 'محتوا', 'سیستم'].map(group => {
          const entries = resources.filter(r => r.group === group && r.id !== 'AgriculturalOrder' && (!listingsMode || !listingHiddenResources.has(r.id)) && matches(r.title));
          if (!entries.length) return null;
          const shown = !!search.trim() || expanded.includes(group);
          return <div className="nav-section" key={group}><button className="nav-section-toggle" aria-expanded={shown} aria-controls={'nav-' + group} onClick={() => setExpanded(x => shown ? x.filter(g => g !== group) : [...x, group])}>{group}<ChevronDown size={15} className={shown ? 'rotated' : ''} /></button>
            {shown && <div id={'nav-' + group}>{entries.map(r => { const Icon = icons[r.icon as keyof typeof icons] ?? Circle; return <NavLink key={r.id} to={'/manage/' + r.id}><Icon size={17} />{r.title}</NavLink>; })}</div>}
          </div>;
        })}
        {matches('بررسی خرید با کد') && <NavLink to="/checkout"><Search size={18} />بررسی خرید با کد</NavLink>}
        {matches('تنظیمات') && <NavLink to="/settings"><Settings size={18} />تنظیمات</NavLink>}
        {!!search.trim() && !resources.some(r => matches(r.title)) && !work.some(r => matches(r.title)) && !['داشبورد', 'تنظیمات', 'بررسی خرید با کد'].some(matches) && <p className="nav-empty">بخشی با این نام پیدا نشد.</p>}
      </nav>
      <div className="sidebar-footer"><ShieldCheck size={18} /><span>مدیریت ساده، رسیدگی دقیق</span></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="topbar-start"><button className="mobile-menu icon-button" aria-label="بازکردن منو" aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen(true)}><Menu size={21} /></button><NavLink to="/" className="topbar-label">مدیریت الوگیاه</NavLink><ChevronLeft size={14} className="breadcrumb-separator" /><strong className="breadcrumb-current">{title}</strong></div>
      <div className="user-menu"><span className="avatar">{(user?.fName || user?.userName || 'م').slice(0, 1)}</span><div><b>{user?.fName || user?.userName}</b><small>{user?.roles.includes('Manager') ? 'مدیر ارشد' : 'ادمین'}</small></div><button className="icon-button" aria-label="خروج از حساب" title="خروج" onClick={logout}><LogOut size={18} /></button></div>
    </header><main id="main-content" tabIndex={-1}>{lookups.error && <div role="alert" className="integration-alert">اطلاعات پایه پنل دریافت نشد. اتصال سرور را بررسی کنید. <button className="text-button" onClick={() => void lookups.refetch()}>تلاش دوباره</button></div>}<Outlet /></main><footer className="main-footer">الوگیاه · پنل مدیریت</footer></div>
  </div>;
}
