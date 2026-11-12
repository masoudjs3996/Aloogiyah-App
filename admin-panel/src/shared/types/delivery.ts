export type DeliveryTariffLine = { key: string; categoryCode?: string | null; name: string; quantity: number; saleUnit?: string | null; blockSize: number | null; blockCount: number | null; pricePerBlock: number | null; fee: number | null };
export type DeliveryPoint = { code: string; name: string; address: string; hours: string; collectionTerms: string; isActive: boolean; directFee: number | null; countyId?: number | null; countyName?: string | null };
export type DeliveryLeg = { pricingDetails?: DeliveryTariffLine[]; originCode?: string; isDeferred?: boolean; code: string; kind: "InterHub" | "Local"; route: string; fee: number | null; transitDays: number; status: string };
export type DeliveryRoute = { isBidirectional?: boolean; pricingMode?: "Flat" | "CategoryUnits"; tariffCount?: number; code: string; originCode: string; originName: string; destinationCode: string; destinationName: string; fee: number | null; transitDays: number; isActive: boolean; maxQuantity: number | null };
export type DeliveryLine = { saleUnit?: string | null; originCode?: string; isPaid?: boolean; orderStatus?: string; receivedAtOriginQuantity?: number; originPoint?: string; interHub?: boolean; itemCode: string; orderCode: string; farmName: string; name: string; quantity: number; receivedAtHubQuantity: number; deliveredQuantity: number; allocatedQuantity: number };
export type DeliveryBatch = { code: string; agentId: number; status: string; expectedAt: string; note: string | null; completedAt: string | null; items: { saleUnit?: string | null; itemCode: string; orderCode: string; farmName: string; name: string; quantity: number }[] };
export type DeliveryBooking = { knownFee?: number; hasUnpricedLegs?: boolean; deferredFeeLimit?: number | null; heldDeliveryFee?: number; deferredFeePaid?: number | null; proposedDeferredFee?: number | null; destinationCode?: string | null; legs?: DeliveryLeg[]; code: string; checkoutCode: string | null; method: string; window: string; point: string; address: string; fee: number | null; quoteExpiresAt: string; requestedMethod: string | null; changeFee: number | null; changeReason: string | null; items: DeliveryLine[]; batches: DeliveryBatch[]; events: { actorId: number; action: string; note: string; createdAt: string }[] };
export type DeliveryPage = { items: DeliveryBooking[]; totalCount: number; pageNumber: number; pageSize: number };
export type DeliveryCode = { code: string; expiresAt: string };
export type DeliverySelection = { code: string; fee: number; fingerprint: string };
export const deliveryStatuses: Record<string, string> = { Ready: "آماده تحویل", OutForDelivery: "در مسیر مقصد", Completed: "تحویل با کد خریدار", Disputed: "مشکل ثبت‌شده؛ منتظر بررسی", Failed: "تحویل ناموفق", Cancelled: "لغوشده" };
export function deliveryAddress(snapshot: string): string {
  try { const a = JSON.parse(snapshot); return [a.Recipient, a.PhoneNumber, a.Province, a.County, a.City, a.Village, a.Street, a.PostalCode && `کد پستی ${a.PostalCode}`].filter(Boolean).join("، "); } catch { return snapshot; }
}

export function deliveryCodeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".includes(digit) ? "۰۱۲۳۴۵۶۷۸۹".indexOf(digit) : "٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[^0-9]/g, "");
}
