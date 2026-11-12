import { isValidJalaaliDate, toGregorian, toJalaali } from "jalaali-js";

export const persianLocale = "fa-IR-u-ca-persian";
const latinDigits = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (d) =>
    String(
      "۰۱۲۳۴۵۶۷۸۹".includes(d)
        ? "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
        : "٠١٢٣٤٥٦٧٨٩".indexOf(d),
    ),
  );

/** User-entered Solar Hijri date, optionally followed by local HH:mm. */
export function persianToISO(value: string): string {
  const parts = latinDigits(value)
    .trim()
    .match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2}))?$/);
  if (!parts)
    throw new Error(
      "تاریخ شمسی را به شکل ۱۴۰۵/۰۷/۲۵ و ساعت را به شکل ۱۴:۳۰ وارد کنید",
    );
  const [, y, m, d, h = "0", min = "0"] = parts;
  const [year, month, day, hour, minute] = [y, m, d, h, min].map(Number);
  if (
    year < 1200 ||
    year > 1600 ||
    !isValidJalaaliDate(year, month, day) ||
    hour > 23 ||
    minute > 59
  )
    throw new Error("تاریخ یا ساعت شمسی معتبر نیست");
  const { gy, gm, gd } = toGregorian(year, month, day);
  const date = new Date(gy, gm - 1, gd, hour, minute);
  if (date.getHours() !== hour || date.getMinutes() !== minute)
    throw new Error("ساعت انتخاب‌شده معتبر نیست");
  return date.toISOString();
}

export function persianInput(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const { jy, jm, jd } = toJalaali(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jy}/${pad(jm)}/${pad(jd)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function persianDate(value?: string, withTime = false): string {
  if (!value) return "تعیین نشده";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "تاریخ نامعتبر";
  return new Intl.DateTimeFormat(persianLocale, {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(date);
}
