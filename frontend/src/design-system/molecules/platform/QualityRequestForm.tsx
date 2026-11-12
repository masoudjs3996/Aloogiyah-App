"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import type { QualityQuote } from "@/shared/types/platform";
import { money } from "@/shared/utils/platform";
import ProductPicker from "./ProductPicker";
import { TextField, TextAreaField } from "./FormField";
import ActionBar from "./ActionBar";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
export default function QualityRequestForm({ product, order, done }: { product: string; order?: string; done: () => void }) {
  const [code, setCode] = useState(product);
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [quote, setQuote] = useState<QualityQuote>();
  const attempt = useRef<{ fingerprint: string; key: string } | undefined>(undefined);
  const tariff = useQuery({ queryKey: ["platform", "quality-tariff"], queryFn: platformApi.qualityFee });
  const pricing = usePlatformMutation(platformApi.quoteQuality, [], "هزینهٔ درخواست بررسی شد");
  const payment = usePlatformMutation(platformApi.requestQuality, ["assessments", "wallet"], "پرداخت انجام شد و درخواست کارشناسی ثبت شد");
  async function pay() {
    if (!quote) return;
    const data = { agriculturalProductCode: code, agriculturalOrderCode: order || undefined, quantity: Number(quantity), requestDescription: description.trim(), discountCode: discount.trim() || undefined, expectedAmount: quote.payableAmount };
    const fingerprint = JSON.stringify(data);
    if (attempt.current?.fingerprint !== fingerprint) {
      let saved;
      try { saved = JSON.parse(sessionStorage.getItem("aloogiyah:quality-attempt") || "null"); } catch {}
      attempt.current = saved?.fingerprint === fingerprint && typeof saved.key === "string" ? saved : { fingerprint, key: crypto.randomUUID() };
      try { sessionStorage.setItem("aloogiyah:quality-attempt", JSON.stringify(attempt.current)); } catch {}
    }
    try {
      await payment.mutateAsync({ ...data, idempotencyKey: attempt.current!.key });
      try { sessionStorage.removeItem("aloogiyah:quality-attempt"); } catch {}
      done();
    } catch { /* Keep the attempt key for safe retries. */ }
  }
  return <form className="space-y-5" onSubmit={async (event) => {
    event.preventDefault();
    if (quote) return pay();
    try { setQuote(await pricing.mutateAsync({ agriculturalProductCode: code, discountCode: discount.trim() || undefined })); } catch {}
  }}>
    <ol className="flex gap-3 rounded-xl bg-slate-50 p-3 text-xs" aria-label="مراحل درخواست"><li className={!quote ? "font-bold text-emerald-700" : "text-slate-500"}>۱. شرح درخواست</li><li className={quote ? "font-bold text-emerald-700" : "text-slate-500"}>۲. تأیید و پرداخت</li></ol>
    {!quote ? <>
      {!product && <ProductPicker value={code} onChange={setCode} />}
      <TextField label="مقدار محصول برای بررسی (کیلوگرم)" type="number" min="0.01" max="100000000" step="0.01" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <TextAreaField label="شرح درخواست و هماهنگی بازدید" required maxLength={700} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="محل بازدید، مقدار محصول و مواردی که نیاز به بررسی دارند" />
      <TextField label="کد تخفیف کیفیت‌سنجی (اختیاری)" dir="ltr" maxLength={100} value={discount} onChange={(e) => setDiscount(e.target.value)} />
      <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">هزینهٔ کارشناسی: {money(tariff.data)}</p>
      {tariff.isError && <p className="text-sm text-red-600">هزینه دریافت نشد. <button type="button" className="font-bold underline" onClick={() => tariff.refetch()}>تلاش دوباره</button></p>}
      <ActionBar><ActionButton type="submit" busy={pricing.isPending} disabled={!code || !tariff.data}>بررسی هزینه و ادامه</ActionButton></ActionBar>
    </> : <>
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{description}</p>
      <dl className="space-y-3 rounded-2xl bg-emerald-50 p-4 text-sm"><div className="flex justify-between"><dt>هزینه کارشناسی</dt><dd>{money(quote.fee)}</dd></div><div className="flex justify-between"><dt>تخفیف</dt><dd>{money(quote.discountAmount)}</dd></div><div className="flex justify-between border-t border-emerald-200 pt-3 font-bold text-emerald-800"><dt>مبلغ پرداخت</dt><dd>{money(quote.payableAmount)}</dd></div></dl>
      <p className="text-sm text-slate-500">موجودی آزاد کیف پول: {money(quote.availableBalance)}</p>
      {quote.availableBalance < quote.payableAmount ? <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">موجودی کافی نیست. <Link href="/dashboard/profile/wallet" className="font-bold underline">شارژ کیف پول</Link><ActionButton variant="secondary" className="mt-3" onClick={async () => { try { setQuote(await pricing.mutateAsync({ agriculturalProductCode: code, discountCode: discount.trim() || undefined })); } catch {} }}>بررسی دوباره موجودی</ActionButton></div> : <p className="text-xs leading-6 text-slate-500">با تأیید، مبلغ از کیف پول کسر و درخواست برای تخصیص کارشناس ثبت می‌شود.</p>}
      <ActionBar><ActionButton variant="secondary" disabled={payment.isPending} onClick={() => setQuote(undefined)}>ویرایش درخواست</ActionButton><ActionButton type="submit" busy={payment.isPending} disabled={quote.availableBalance < quote.payableAmount}>تأیید پرداخت و ثبت درخواست</ActionButton></ActionBar>
    </>}
  </form>;
}
