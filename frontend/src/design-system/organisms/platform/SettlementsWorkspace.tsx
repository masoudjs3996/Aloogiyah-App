"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { iranIbanDigits, settlementRules } from "@/shared/utils/settlement-form";
import { normalizeMoney, formatMoneyInput } from "@/shared/utils/money-input";
import { request, errorMessage } from "@/lib/actions/platform";
import { settlementStatuses, settlementActions, type Settlement, type SettlementPage, type SettlementSummary, type SellerIncome } from "@/shared/types/settlement";

const money = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;
const date = (s: string | null) => s ? new Date(s.length === 10 ? `${s}T12:00:00+03:30` : s).toLocaleString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium" }) : "—";
const field = "w-full rounded-xl border border-slate-300 bg-white p-3";
const button = "rounded-xl bg-emerald-700 px-4 py-2 text-white disabled:opacity-50";

export default function SettlementsWorkspace() {
  const client = useQueryClient();
  const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const [amount, setAmount] = useState(""); const [iban, setIban] = useState(""); const [holder, setHolder] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const key = useRef(""); const signature = useRef("");
  const summary = useQuery({ queryKey: ["settlements", "summary"], queryFn: () => request<SettlementSummary>("/Settlement/Summary") });
  const list = useQuery({ queryKey: ["settlements", "requests", status, page], queryFn: () => request<SettlementPage<Settlement>>("/Settlement/Requests", { params: { status, page } }) });
  const income = useQuery({ queryKey: ["settlements", "income", page], queryFn: () => request<SettlementPage<SellerIncome>>("/Settlement/Income", { params: { page } }) });
  const refresh = () => client.invalidateQueries({ queryKey: ["settlements"] });
  async function act(work: () => Promise<unknown>, message: string) {
    setBusy(true); setError(""); setSuccess("");
    try { await work(); await refresh(); setSuccess(message); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <section className="mx-auto w-full max-w-6xl space-y-6" dir="rtl">
    <header><h1 className="text-2xl font-bold">حساب مالی و تسویه کشاورز</h1><p className="mt-2 text-sm leading-7 text-slate-600">درآمد فروش پس از ثبت کد تحویل خریدار آزاد می‌شود و می‌توانید درخواست واریز به حساب ثبت کنید.</p></header>
    {(summary.isLoading || list.isLoading) && <p role="status">در حال دریافت اطلاعات…</p>}
    {(summary.error || list.error || income.error) && <div role="alert" className="rounded-xl bg-red-50 p-4">{errorMessage(summary.error || list.error || income.error)} <button onClick={() => void refresh()}>تلاش دوباره</button></div>}
    {summary.data && <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["درآمد رزروشده", summary.data.reserved], ["قابل درخواست", summary.data.available], ["در انتظار تسویه", summary.data.pending], ["پرداخت‌شده", summary.data.paid]].map(([label, value]) => <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50 p-4" key={label}><p>{label}</p><p className="mt-3 break-words text-lg font-bold sm:text-xl">{money(Number(value))}</p></div>)}</div>
      <p>کارمزد: {summary.data.commissionRate.toLocaleString("fa-IR")}٪ · مالیات: {summary.data.taxRate.toLocaleString("fa-IR")}٪</p>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-4 rounded-2xl border bg-white p-4 sm:p-5" onSubmit={e => { e.preventDefault(); void act(async () => {
        const data = { amount: Number(amount), iban: "IR" + iban, accountHolder: holder };
        if (!Number.isFinite(data.amount) || data.amount <= 0 || data.amount > summary.data!.available) throw new Error("مبلغ مثبت و حداکثر برابر درآمد آزاد وارد کنید.");
        if (iban.length !== 24) throw new Error("۲۴ رقم شماره شبا را کامل وارد کنید.");
        const next = JSON.stringify(data); if (!key.current || next !== signature.current) { key.current = crypto.randomUUID(); signature.current = next; }
        await request("/Settlement/Requests", { method: "POST", data: { ...data, idempotencyKey: key.current } });
        key.current = ""; setAmount("");
      }, "درخواست تسویه ثبت شد و مبلغ برای واریز کنار گذاشته شد."); }}>
        <h2 className="text-lg font-bold">درخواست واریز به حساب</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">مبلغ به تومان<input className={field} inputMode="decimal" required dir="ltr" value={formatMoneyInput(amount)} onChange={e => { const raw = normalizeMoney(e.target.value); if (raw !== null) setAmount(raw); }} /></label>
          <label className="block text-sm font-medium">نام صاحب حساب<input className={field} required minLength={3} maxLength={150} value={holder} onChange={e => setHolder(e.target.value)} /></label>
          <label className="block text-sm font-medium sm:col-span-2">شماره شبا
            <span className="mt-1 flex min-w-0 items-center overflow-hidden rounded-xl border border-slate-300 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600" dir="ltr">
              <span aria-hidden="true" className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-3 font-bold text-slate-600">IR</span>
              <input aria-label="۲۴ رقم شماره شبا؛ پیشوند IR خودکار است" className="min-w-0 flex-1 bg-white px-3 py-3 text-left text-sm outline-none" dir="ltr" inputMode="numeric" autoComplete="off" required minLength={24} maxLength={34} pattern="[0-9]{24}" placeholder="۲۴ رقم شماره شبا" value={iban} onChange={e => { const raw = iranIbanDigits(e.target.value); if (raw !== null) setIban(raw); }} />
            </span>
            <small className="mt-1 block text-xs font-normal leading-6 text-slate-500">فقط ۲۴ رقم شبا را وارد کنید؛ IR خودکار اضافه می‌شود.</small>
          </label>
        </div>
        <p className="text-xs leading-6 text-slate-500">حساب بانکی باید متعلق به کشاورز باشد؛ نام صاحب حساب و شبا پیش از واریز بررسی می‌شوند.</p>
        <button className={button} disabled={busy || summary.data.available <= 0}>ثبت درخواست تسویه</button>
      </form>
      <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5"><h2 className="font-bold text-emerald-900">قوانین تسویه حساب</h2><ul className="mt-3 list-inside list-disc space-y-3 text-sm leading-7 text-slate-600">{settlementRules.map(rule => <li key={rule}>{rule}</li>)}</ul></aside>
      </div>
    </>}
    {error && <p role="alert" className="text-red-700">{error}</p>}{success && <p role="status" className="text-emerald-800">{success}</p>}
    <section className="space-y-4"><h2 className="text-xl font-bold">درخواست‌ها و سوابق واریز</h2>
      <label>وضعیت <select className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 sm:mx-2 sm:mt-0 sm:w-56" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">همه</option>{Object.entries(settlementStatuses).map(([v, title]) => <option key={v} value={v}>{title}</option>)}</select></label>
      {list.data?.items.length === 0 && <p className="rounded-xl bg-slate-50 p-5">درخواستی در این بخش ثبت نشده است.</p>}
      {list.data?.items.map(r => <article key={r.code} className="space-y-3 rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><b>{money(r.amount)}</b><span>{settlementStatuses[r.status] || r.status}</span></div>
        <p>کد: {r.code} · ثبت: {date(r.createdAt)} · موعد: {r.scheduledDate ? date(r.scheduledDate) : "در انتظار تعیین موعد"}</p><p>صاحب حساب: {r.accountHolder} · <span dir="ltr">{r.iban}</span></p>
        {r.paidAt && <p>تاریخ واریز: {date(r.paidAt)} · شناسه پیگیری: {r.transferReference}</p>}
        <details><summary className="cursor-pointer">جزئیات و سابقه درخواست</summary><ul className="mt-3 space-y-2">{r.history.map((h, i) => <li key={i}>{date(h.createdAt)} — {settlementActions[h.action] || h.action}{h.note && `: ${h.note}`}</li>)}</ul></details>
        {r.status === "Pending" && <button className={button} disabled={busy} onClick={() => void act(() => request(`/Settlement/Requests/${encodeURIComponent(r.code)}/Actions`, { method: "POST", data: { action: "Cancel" } }), "درخواست لغو شد و مبلغ آزاد شد.")}>لغو درخواست</button>}
      </article>)}
    </section>
    <section className="space-y-3"><h2 className="text-xl font-bold">درآمد سفارش‌ها</h2>{income.data?.items.length === 0 && <p>هنوز درآمدی ثبت نشده است.</p>}{income.data?.items.map(x => <div key={x.orderCode} className="rounded-xl border bg-white p-4"><p>سفارش {x.orderCode}: {money(x.netAmount)} · آزادشده: {money(x.releasedAmount)} · باقی‌مانده: {money(x.netAmount - x.releasedAmount)}</p><p className="text-sm leading-7 text-emerald-900">تخفیف با هزینهٔ الو گیاه: {money(x.platformDiscountAmount || 0)} (بدون کسر از سهم شما) · تخفیف با هزینهٔ شما: {money(x.sellerDiscountAmount || 0)}</p><p className="text-sm text-slate-500">کارمزد: {x.commissionRate}٪ ({money(x.commissionAmount)}) · مالیات: {x.taxRate}٪ ({money(x.taxAmount)})</p></div>)}</section>
    <div className="flex items-center gap-4"><button className={button} disabled={page === 1} onClick={() => setPage(p => p - 1)}>قبلی</button><span>صفحه {page.toLocaleString("fa-IR")}</span><button className={button} disabled={page * 20 >= Math.max(list.data?.totalCount || 0, income.data?.totalCount || 0)} onClick={() => setPage(p => p + 1)}>بعدی</button></div>
    <Link className="inline-block text-emerald-800 underline" href="/dashboard/profile/wallet">بازگشت به کیف پول خرید</Link>
  </section>;
}
