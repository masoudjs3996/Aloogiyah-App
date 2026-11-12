import type { DeliveryBooking } from "@/shared/types/delivery";
import { money } from "@/shared/utils/platform";
import { saleUnitLabel } from "@/shared/utils/sale-units";

export default function DeliveryCostSummary({ booking }: { booking: DeliveryBooking }) {
  if (!booking.destinationCode) return null;
  const transfers = booking.legs?.filter(l => l.kind === "InterHub") ?? [];
  const local = booking.legs?.find(l => l.kind === "Local");
  const transferFee = transfers.some(l => l.fee == null) ? null : transfers.reduce((sum, l) => sum + (l.fee ?? 0), 0);
  return <div className="space-y-2 rounded-xl border border-emerald-100 bg-white p-4 text-sm leading-7">
    <p className="font-bold">میدان دریافت: {booking.point}</p>
    <p>انتقال بین میدان‌ها: {transferFee == null ? "در انتظار اعلام هزینه" : money(transferFee)}</p>
    {local && <p>ارسال از میدان دریافت به نشانی: {local.fee == null ? "در انتظار اعلام هزینه" : money(local.fee)}</p>}
    <p className="font-bold">هزینه قطعی حمل: {money(booking.fee ?? booking.knownFee ?? 0)}</p>
    {transfers.some(l => l.pricingDetails?.length) && <details><summary>جزئیات محاسبه کرایه دسته‌بندی‌ها</summary>{transfers.map(l => <div key={l.code}><p className="font-bold">{l.route}</p>{l.pricingDetails?.map(d => <p key={d.key}>{d.blockSize == null && d.fee != null ? `${d.name} · ${money(d.fee ?? undefined)}` : <>{d.name}: {d.quantity.toLocaleString("fa-IR")} {saleUnitLabel(d.saleUnit)}؛ {d.blockSize == null ? "تعرفه نیازمند بررسی" : `هر ${d.blockSize.toLocaleString("fa-IR")} ${saleUnitLabel(d.saleUnit)}، ${money(d.pricePerBlock ?? undefined)} · ${d.blockCount?.toLocaleString("fa-IR")} واحد حمل · ${money(d.fee ?? undefined)}`}</>}</p>)}</div>)}</details>}
    {booking.deferredFeePaid != null && <p>تسویه بخش نامشخص: {money(booking.deferredFeePaid)}؛ باقیمانده رزرو آزاد شد.</p>}
    {transfers.length > 0 && <details><summary>مسیر و زمان تقریبی انتقال</summary>{transfers.map(l => <p key={l.code}>{l.route} · حدود {l.transitDays.toLocaleString("fa-IR")} روز پس از آماده‌شدن بار</p>)}</details>}
  </div>;
}
