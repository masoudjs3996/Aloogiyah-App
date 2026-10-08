export const faNumber = (value: number | string) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(
    Number(value) || 0,
  );
export const money = (value?: number) =>
  value == null ? "تعیین نشده" : `${faNumber(value)} تومان`;
export function dateLabel(value?: string) {
  if (!value) return "تعیین نشده";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "تاریخ نامعتبر"
    : new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
export function englishDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(
      "۰۱۲۳۴۵۶۷۸۹".includes(digit)
        ? "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
        : "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
    ),
  );
}
export function isoDate(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime()))
    throw new Error("تاریخ را درست وارد کنید");
  return date.toISOString();
}
export const isManager = (role?: string) =>
  role === "Admin" || role === "Manager";
export const hasRole = (roles: string[] | undefined, role: string, fallback?: string) =>
  roles?.includes(role) ?? fallback === role;
export const hasManagerRole = (roles: string[] | undefined, fallback?: string) =>
  hasRole(roles, "Admin", fallback) || hasRole(roles, "Manager", fallback);
export const serviceLabel = (type: number | string) =>
  ({
    "0": "رسیدگی به گلدان",
    "1": "رسیدگی به باغچه",
    "2": "رسیدگی به گلخانه",
    Vase: "رسیدگی به گلدان",
    Garden: "رسیدگی به باغچه",
    Greenhouse: "رسیدگی به گلخانه",
  })[String(type)] || "درخواست خدمت";
export function auctionState(
  start: string,
  end: string,
  winner?: string,
  now = Date.now(),
) {
  return winner
    ? "نهایی شده"
    : now >= new Date(end).getTime()
      ? "پایان یافته"
      : now < new Date(start).getTime()
        ? "به‌زودی"
        : "در حال برگزاری";
}

export function serviceStatusLabel(code: string) {
  try {
    const labels = JSON.parse(
      process.env.NEXT_PUBLIC_SERVICE_STATUS_LABELS || "{}",
    );
    return labels[code] || "درخواست ثبت‌شده";
  } catch {
    return "درخواست ثبت‌شده";
  }
}
