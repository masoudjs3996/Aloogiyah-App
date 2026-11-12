"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/actions/platform";
import type { TermsEnvelope } from "@/shared/types/legal";

export default function PrivacyPage() {
  const { data } = useQuery({
    queryKey: ["marketplace-terms", "current"],
    queryFn: () => request<TermsEnvelope>("/Legal/Terms"),
  });
  const support = data?.operator;

  return (
    <article dir="rtl" className="mx-auto max-w-3xl space-y-6 px-4 py-8 leading-8 text-slate-700">
      <h1 className="text-2xl font-bold text-slate-900">سیاست حریم خصوصی الو گیاه</h1>
      <section className="space-y-2">
        <h2 className="text-lg font-bold">چه داده‌هایی دریافت می‌کنیم؟</h2>
        <p>نام، شماره موبایل، ایمیل یا نام کاربری برای ایجاد حساب و ارتباط با شما استفاده می‌شوند. آگهی‌ها، عکس‌ها و مشخصات عمومی مزرعه برای نمایش در بازارگاه ثبت می‌شوند. اطلاعاتی که در آگهی یا صفحهٔ مزرعه منتشر می‌کنید ممکن است برای بازدیدکنندگان قابل مشاهده باشد.</p>
        <p>پیام‌ها و پیوست‌ها برای ارائهٔ گفت‌وگو پردازش می‌شوند. مدارک هویتی و محل فعالیت که برای درخواست همکاری بارگذاری می‌کنید در دسترس مسئولان مجاز بررسی قرار می‌گیرند. نشانی یا موقعیت را زمانی دریافت می‌کنیم که خودتان در فرم مربوط ثبت کنید. اگر اعلان پوش را فعال کنید، شناسهٔ ارسال اعلان دستگاه برای رساندن اعلان‌ها ثبت می‌شود.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold">گزارش محتوا و مسدودسازی</h2>
        <p>انتشار محتوای آزاردهنده، تهدیدآمیز، فریبنده یا ناقض حریم خصوصی مجاز نیست. می‌توانید آگهی را از صفحهٔ جزئیات و پیام دریافتی را از گزینه‌های پیام گزارش کنید. تیم پشتیبانی برای رسیدگی به گزارش می‌تواند متن و پیوست گزارش‌شده را بررسی کند. در گفت‌وگو هم می‌توانید ارسال پیام از یک حساب را مسدود کنید.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold">حذف حساب و نگهداری سوابق</h2>
        <p>در اپ به «داشبورد»، سپس «حساب کاربری» و «حذف حساب کاربری» بروید. پس از تأیید، دسترسی حساب لغو می‌شود و داده‌های پروفایل، آگهی‌ها، پیام‌های ارسالی و مدارک مرتبط از دسترس خارج می‌شوند. فایل‌های متعلق به حساب در فرایند پاک‌سازی حذف می‌شوند. نسخه‌های پشتیبان تا پایان چرخهٔ نگهداری و سوابق ضروری تراکنش یا تعهدات قانونی ممکن است باقی بمانند.</p>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold">تماس با پشتیبانی</h2>
        {!!support?.name && <p>{support.name}</p>}
        {!!support?.email && <p>ایمیل <a className="text-emerald-800 underline" href={`mailto:${support.email}`}><bdi>{support.email}</bdi></a></p>}
        {!!support?.phone && <p>تلفن <a className="text-emerald-800 underline" href={`tel:${support.phone}`}><bdi>{support.phone}</bdi></a></p>}
        <Link href="/terms" className="text-emerald-800 underline">قوانین همکاری و اطلاعات بهره‌بردار</Link>
      </section>
    </article>
  );
}
