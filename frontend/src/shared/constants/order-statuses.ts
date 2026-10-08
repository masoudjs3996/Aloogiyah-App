// همان AgriculturalOrderStatuses.cs؛ وضعیت از حدس یا داده نمونه ساخته نمی‌شود.
export const orderStatuses = [
  { code: "", label: "همه سفارش‌ها" }, { code: "3EFC703625", label: "در انتظار پرداخت" },
  { code: "631EE7CF1A", label: "بررسی موجودی" }, { code: "22C82A6DC4", label: "تأیید شده" },
  { code: "42A1657DE4", label: "ارسال شده" }, { code: "70972F464D", label: "تحویل شده" },
  { code: "92494C9290", label: "رد شده" }, { code: "84F424CD42", label: "پرداخت ناموفق" },
];
export const orderActionLabels: Record<string, string> = { Approve: "تأیید سفارش", Reject: "رد سفارش", Ship: "ثبت ارسال", ConfirmDelivery: "تأیید دریافت", FundsHeld: "رزرو وجه در کیف پول", ApprovalExpired: "پایان مهلت تأیید فروشنده و آزادسازی وجه", CheckoutCancelled: "لغو خرید", CheckoutExpired: "پایان مهلت پرداخت", CompleteRefund: "ثبت بازپرداخت" };
export const paymentLabels: Record<string, string> = { Pending: "در انتظار پرداخت", Held: "وجه رزرو شده", Paid: "پرداخت شده", Released: "وجه آزاد شده", PartiallyPaid: "پرداخت بخشی از سفارش‌ها" };
