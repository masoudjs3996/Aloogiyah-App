"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/actions/platform";
import type { TermsEnvelope } from "@/shared/types/legal";
import QueryState from "@/design-system/molecules/platform/QueryState";

export function TermsBody({ terms }: { terms: TermsEnvelope }) {
  return <article dir="rtl" className="space-y-6 text-slate-700">
    <header className="space-y-3"><p className="text-sm font-bold text-emerald-800">بازارگاه الو گیاه</p><h1 className="text-2xl font-bold leading-relaxed text-slate-900">{terms.document.title}</h1><p className="text-sm">نسخه {terms.document.version} · تاریخ انتشار {new Date(`${terms.document.publishedOn}T12:00:00+03:30`).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })}</p><p className="leading-8">{terms.document.introduction}</p></header>
    <section className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50 p-4"><h2 className="font-bold">مشخصات بهره‌بردار و ارتباط رسمی</h2>{terms.operator.name && <p>{terms.operator.name}</p>}{terms.operator.address && <p>نشانی: {terms.operator.address}</p>}{terms.operator.email && <p>ایمیل: <span dir="ltr">{terms.operator.email}</span></p>}{terms.operator.phone && <p>تلفن: <span dir="ltr">{terms.operator.phone}</span></p>}{(!terms.operator.name || !terms.operator.address || (!terms.operator.email && !terms.operator.phone)) && <p className="text-sm leading-7">مشخصات رسمی بهره‌بردار یا راه ارتباطی هنوز کامل نشده است.</p>}</section>
    <nav aria-label="فهرست قوانین" className="grid gap-2 rounded-2xl bg-emerald-50 p-4 sm:grid-cols-2">{terms.document.sections.map(s => <a key={s.id} className="text-sm leading-7 text-emerald-900 underline" href={`#terms-${s.id}`}>{s.title}</a>)}</nav>
    {terms.document.sections.map(s => <section key={s.id} id={`terms-${s.id}`} className="scroll-mt-6 space-y-3 rounded-2xl border border-slate-100 bg-white p-5"><h2 className="text-lg font-bold text-slate-900">{s.title}</h2>{s.audience !== "All" && <p className="text-xs font-bold text-emerald-800">{s.audience === "Farmer" ? "ویژه کشاورز و فروشنده" : "ویژه خریدار همکار"}</p>}{s.paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line text-sm leading-8">{p}</p>)}</section>)}
    <section className="space-y-3"><h2 className="font-bold">منابع تدوین</h2><p className="text-sm leading-7">این صفحه شرایط همکاری سامانه را بیان می‌کند؛ متن قانون و حقوق الزامی در صورت تعارض مقدم‌اند.</p><ul className="space-y-2">{terms.document.sources.map(s => <li key={s.url}><a className="text-sm leading-7 text-emerald-800 underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul></section>
  </article>;
}

export default function MarketplaceTermsDocument({ version }: { version?: string }) {
  const q = useQuery({ queryKey: ["marketplace-terms", version || "current"], queryFn: () => request<TermsEnvelope>("/Legal/Terms", { params: { version } }) });
  return <div className="mx-auto max-w-4xl p-4 py-8"><QueryState loading={q.isLoading} error={q.error} retry={() => q.refetch()} />{q.data && <><div className="mb-5 flex justify-end"><button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm" onClick={() => window.print()}>چاپ یا ذخیره قوانین</button></div><TermsBody terms={q.data} /></>}</div>;
}
