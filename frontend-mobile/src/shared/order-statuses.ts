// همان AgriculturalOrderStatuses.cs؛ وضعیت از حدس یا داده نمونه ساخته نمی‌شود.
export const orderStatuses = [
  { code: "", label: "همه سفارش‌ها" },
  { code: "3EFC703625", label: "در انتظار پرداخت" },
  { code: "631EE7CF1A", label: "در حال بررسی" },
  { code: "22C82A6DC4", label: "تأیید شده" },
  { code: "42A1657DE4", label: "ارسال شده" },
  { code: "70972F464D", label: "تحویل شده" },
  { code: "92494C9290", label: "رد شده" },
  { code: "84F424CD42", label: "پرداخت ناموفق" },
];
export const orderActionLabels: Record<string, string> = {
  Approve: "تأیید سفارش",
  Reject: "رد سفارش",
  Ship: "ثبت ارسال",
  ConfirmDelivery: "تأیید دریافت", DeliveryCodeVerified: "تحویل با کد خریدار",
  FundsHeld: "رزرو وجه در کیف پول",
  ApprovalExpired: "پایان مهلت تأیید فروشنده و آزادسازی وجه",
  CheckoutCancelled: "لغو خرید",
  CheckoutExpired: "پایان مهلت پرداخت",
  CompleteRefund: "ثبت بازپرداخت",
};
export const paymentLabels: Record<string, string> = {
  Pending: "در انتظار پرداخت",
  Held: "وجه رزرو شده",
  Paid: "پرداخت شده",
  Released: "وجه آزاد شده",
  PartiallyPaid: "پرداخت بخشی از سفارش‌ها",
};

export const orderProgressSteps = [
  { code: "3EFC703625", label: "ثبت سفارش" },
  { code: "631EE7CF1A", label: "در حال بررسی" },
  { code: "22C82A6DC4", label: "تأیید سفارش" },
  { code: "42A1657DE4", label: "ارسال" },
  { code: "70972F464D", label: "تحویل" },
];

export function isStoppedOrder(statusCode: string, statusTitle = "") {
  return (
    ["92494C9290", "84F424CD42"].includes(statusCode) ||
    /لغو|کنسل|cancel/i.test(statusTitle)
  );
}

export function orderStatusLabel(statusCode: string, statusTitle = "") {
  if (statusCode === "631EE7CF1A") return "در حال بررسی";
  return (
    statusTitle ||
    orderStatuses.find((status) => status.code === statusCode)?.label ||
    statusCode
  );
}

// Receipt counts mark arrival at the receiving hub, never final buyer delivery.
export function orderTrackingState(order: {
  statusCode: string;
  statusTitle?: string;
  history?: { action: string }[];
  orderItems?: { quantity: number; receivedAtHubQuantity?: number }[];
}) {
  const stopped = isStoppedOrder(order.statusCode, order.statusTitle);
  const statusIndex = orderProgressSteps.findIndex(step => step.code === order.statusCode);
  const arrived = statusIndex === 3 && !!order.orderItems?.length &&
    order.orderItems.every(item => item.quantity > 0 && (item.receivedAtHubQuantity ?? 0) >= item.quantity);
  const current = !stopped && arrived ? 4 : statusIndex;
  const actions = order.history?.map(entry => entry.action) ?? [];
  const lastRecorded = actions.includes("ConfirmDelivery") || actions.includes("DeliveryCodeVerified") ? 4
    : actions.includes("Ship") ? 3 : actions.includes("Approve") ? 2 : actions.includes("FundsHeld") ? 1 : 0;
  return { stopped, current, reached: stopped ? lastRecorded : current, delivered: statusIndex === 4 };
}
