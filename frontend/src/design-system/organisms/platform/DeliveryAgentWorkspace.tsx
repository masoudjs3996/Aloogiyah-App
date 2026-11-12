"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { deliveryApi } from "@/lib/actions/delivery";
import { request, errorMessage } from "@/lib/actions/platform";
import { deliveryCodeDigits, deliveryAddress, deliveryStatuses } from "@/shared/types/delivery";
import { dateLabel } from "@/shared/utils/platform";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { TextField, TextAreaField } from "@/design-system/molecules/platform/FormField";
export default function DeliveryAgentWorkspace() {
  const profile = usePlatformProfile();
  const q = useQuery({ queryKey: ["assigned-deliveries"], queryFn: () => deliveryApi.list(), refetchInterval: 10000 });
  const [codes, setCodes] = useState<Record<string, string>>({}); const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function act(booking: string, batch: string, action: string) {
    if (busy) return; setBusy(true); setError("");
    try {
      await request(`/Delivery/Bookings/${booking}/Batches/${batch}/${action === "Verify" ? "Verify" : "Actions/Fail"}`, { method: "POST", data: action === "Verify" ? { code: codes[batch] } : { note } });
      setCodes(old => ({ ...old, [batch]: "" })); await q.refetch();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-5xl space-y-5"><h1 className="text-2xl font-bold">محموله‌های تحویل من</h1><p className="leading-8">کد را پس از تحویل واقعی اقلام و بررسی خریدار دریافت کنید. کد خریدار در حساب نماینده نمایش داده نمی‌شود.</p>
    {(q.error || error) && <p role="alert" className="text-red-700">{error || errorMessage(q.error)}</p>}
    {q.isLoading && <p>در حال دریافت…</p>}
    <TextAreaField label="توضیح تحویل ناموفق" value={note} maxLength={1000} onChange={e => setNote(e.target.value)} />
    {q.data?.items.map(b => <section key={b.code} className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="font-bold">{b.method === "Pickup" ? "میدان بار" : "ارسال مستقیم"} · {b.point}</h2>{b.method === "Direct" && <p>{deliveryAddress(b.address)}</p>}
      {b.batches.map(batch => <article key={batch.code} className="space-y-3 rounded-xl border p-4"><h3>{batch.code} · {deliveryStatuses[batch.status]}</h3><p>{dateLabel(batch.expectedAt)}</p><ul>{batch.items.map(i => <li key={i.itemCode}>{i.name} · {i.farmName} · تعداد {i.quantity}</li>)}</ul>
        {profile.data && ["Ready", "OutForDelivery"].includes(batch.status) && <><TextField label="کد ۶ رقمی خریدار" dir="ltr" inputMode="numeric" autoComplete="off" value={codes[batch.code] || ""} maxLength={6} onChange={e => setCodes({ ...codes, [batch.code]: deliveryCodeDigits(e.target.value) })} /><ActionButton busy={busy} disabled={!/^\d{6}$/.test(codes[batch.code] || "")} onClick={() => void act(b.code, batch.code, "Verify")}>ثبت کد و قطعی کردن تحویل</ActionButton><ActionButton variant="secondary" disabled={busy || note.trim().length < 3} onClick={() => void act(b.code, batch.code, "Fail")}>ثبت تحویل ناموفق</ActionButton></>}
      </article>)}
    </section>)}
    {q.data?.items.length === 0 && <p>محموله‌ای به شما اختصاص داده نشده است.</p>}
  </div>;
}
