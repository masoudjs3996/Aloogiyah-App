import React from "react";
import type { DeliveryBooking } from "../../shared/types/delivery";
import { money } from "../../shared/utils/format";
import { Text } from "../atoms/Text";
import { Card } from "../atoms/Card";
import { saleUnitLabel } from "../../shared/utils/sale-units";

export function DeliveryCostSummary({ booking }: { booking: DeliveryBooking }) {
  if (!booking.destinationCode) return null;
  const transfers = booking.legs?.filter(l => l.kind === "InterHub") ?? [];
  const local = booking.legs?.find(l => l.kind === "Local");
  const transferFee = transfers.some(l => l.fee == null) ? null : transfers.reduce((sum, l) => sum + (l.fee ?? 0), 0);
  return <Card>
    <Text bold>میدان دریافت: {booking.point}</Text>
    <Text>انتقال بین میدان‌ها: {transferFee == null ? "در انتظار اعلام هزینه" : money(transferFee)}</Text>
    {local && <Text>ارسال به نشانی: {local.fee == null ? "در انتظار اعلام هزینه" : money(local.fee)}</Text>}
    <Text bold>هزینه قطعی حمل: {money(booking.fee ?? booking.knownFee ?? 0)}</Text>
    {booking.deferredFeePaid != null && <Text>تسویه بخش نامشخص: {money(booking.deferredFeePaid)}؛ باقیمانده رزرو آزاد شد.</Text>}
    {transfers.map(l => <Text muted key={l.code}>{l.route} · حدود {l.transitDays.toLocaleString("fa-IR")} روز پس از آماده‌شدن بار</Text>)}
    {transfers.flatMap(l => l.pricingDetails ?? []).map(d => <Text muted key={d.key}>{d.blockSize == null && d.fee != null ? `${d.name} · ${money(d.fee ?? undefined)}` : <>{d.name}: {d.quantity.toLocaleString("fa-IR")} {saleUnitLabel(d.saleUnit)}؛ {d.blockSize == null ? "تعرفه نیازمند بررسی" : `هر ${d.blockSize.toLocaleString("fa-IR")} ${saleUnitLabel(d.saleUnit)}، ${money(d.pricePerBlock ?? undefined)} · ${d.blockCount?.toLocaleString("fa-IR")} واحد حمل · ${money(d.fee ?? undefined)}`}</>}</Text>)}
  </Card>;
}
