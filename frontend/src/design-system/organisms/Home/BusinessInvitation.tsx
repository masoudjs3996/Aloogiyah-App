import Link from "next/link";
import { BuildingStorefrontIcon, SunIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function BusinessInvitation() {
  return (
    <section aria-labelledby="business-invitation-title" className="my-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-1">
        <h2 id="business-invitation-title" className="text-base font-black text-slate-900 sm:text-lg">از مزرعه تا مغازه، همراه هم</h2>
        <p className="text-[11px] text-slate-500">از مسیر خودت شروع کن</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { type: "Farmer", Icon: SunIcon, title: "کشاورز یا تولیدکننده‌اید؟", text: "آگهی‌هایتان را مستقیم معرفی کنید، منصفانه بفروشید و با خریداران واقعی ارتباط بگیرید.", action: "شروع همکاری به‌عنوان تولیدکننده", card: "border-emerald-100 bg-gradient-to-l from-emerald-50 to-white", icon: "bg-emerald-100 text-emerald-800", link: "text-emerald-800 hover:bg-emerald-100/60" },
          { type: "Shop", Icon: BuildingStorefrontIcon, title: "برای مغازه‌تان خرید می‌کنید؟", text: "آگهی‌های باکیفیت را مستقیم از تولیدکننده پیدا کنید؛ با قیمت شفاف و انتخابی مطمئن.", action: "شروع همکاری به‌عنوان خریدار", card: "border-[#e9d6a8] bg-gradient-to-l from-[#fbf4e3] to-white", icon: "bg-[#f1cb75] text-[#193f32]", link: "text-emerald-800 hover:bg-[#fbf4e3]" },
        ].map(({ type, Icon, title, text, action, card, icon, link }) => (
          <div key={type} className={`rounded-2xl border p-4 ${card}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${icon}`}><Icon aria-hidden="true" className="h-6 w-6" /></span>
              <div className="min-w-0"><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-6 text-slate-600">{text}</p></div>
            </div>
            <Link href={`/dashboard/business?type=${type}`} className={`mt-3 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${link}`}>{action}<ArrowLeftIcon aria-hidden="true" className="h-4 w-4 shrink-0" /></Link>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs leading-6 text-slate-500">فعال‌سازی حساب همکاری پس از بررسی مدیریت است.</p>
    </section>
  );
}
