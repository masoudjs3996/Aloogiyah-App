import { persianDate, persianToISO } from "./persian-date";
export const faNumber = (value: number | string) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(
    Number(value) || 0,
  );
export const money = (value?: number) =>
  value == null ? "تعیین نشده" : `${faNumber(value)} تومان`;
export const dateLabel = (value?: string) => persianDate(value, true);
export function englishDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(
      "۰۱۲۳۴۵۶۷۸۹".includes(digit)
        ? "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
        : "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
    ),
  );
}
export const isoDate = persianToISO;

export const hasRole = (roles: string[] | undefined, role: string, fallback?: string) =>
  roles?.includes(role) ?? fallback === role;

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
