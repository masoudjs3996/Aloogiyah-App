import { toGregorian, toJalaali, isValidJalaaliDate } from "jalaali-js";
import { persianToISO } from "./persian-date";

export const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
export const weekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
export const digits = (n: number) =>
  n.toLocaleString("fa-IR", { useGrouping: false });
export type CalendarValue = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};
export function calendarValue(
  value: string,
  fallback = new Date(),
): CalendarValue {
  let date = fallback;
  try {
    date = new Date(persianToISO(value));
  } catch {
    /* Start empty fields at today. */
  }
  const { jy, jm, jd } = toJalaali(date);
  return {
    year: jy,
    month: jm,
    day: jd,
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}
export function monthDays(year: number, month: number) {
  return isValidJalaaliDate(year, month, 31)
    ? 31
    : isValidJalaaliDate(year, month, 30)
      ? 30
      : 29;
}
export function monthCells(year: number, month: number): (number | null)[] {
  const { gy, gm, gd } = toGregorian(year, month, 1);
  const offset = (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= monthDays(year, month); day++) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function moveMonth(value: CalendarValue, delta: number): CalendarValue {
  const index = value.year * 12 + value.month - 1 + delta;
  const year = Math.floor(index / 12),
    month = (((index % 12) + 12) % 12) + 1;
  return {
    ...value,
    year,
    month,
    day: Math.min(value.day, monthDays(year, month)),
  };
}
export function calendarInput(value: CalendarValue) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.year}/${pad(value.month)}/${pad(value.day)} ${pad(value.hour)}:${pad(value.minute)}`;
}
export function calendarISO(value: CalendarValue) {
  return persianToISO(calendarInput(value));
}

export type DateRules = {
  min?: string;
  max?: string;
  futureOnly?: boolean;
  maxDaysAhead?: number;
};
export type DateBounds = { min: number; max: number };
export function dateBounds(rules: DateRules, now = new Date()): DateBounds {
  let min = rules.min ? Date.parse(rules.min) : -Infinity;
  let max = rules.max ? Date.parse(rules.max) : Infinity;
  if (rules.futureOnly || rules.maxDaysAhead !== undefined)
    min = Math.max(min, Math.floor(now.getTime() / 60000) * 60000);
  if (rules.maxDaysAhead !== undefined) {
    max = Math.min(
      max,
      Math.floor(now.getTime() / 60000) * 60000 + rules.maxDaysAhead * 86400000,
    );
  }
  return { min, max };
}
export function dateError(
  value: string,
  rules: DateRules,
  now = new Date(),
): string {
  if (!value.trim()) return "";
  try {
    const time = Date.parse(persianToISO(value));
    const bounds = dateBounds(rules, now);
    if (time < bounds.min)
      return "تاریخ و ساعت انتخاب‌شده پیش از حداقل زمان مجاز است";
    if (time > bounds.max)
      return rules.maxDaysAhead !== undefined
        ? `انتخاب تاریخ فقط تا ${digits(rules.maxDaysAhead)} روز آینده مجاز است`
        : "تاریخ و ساعت انتخاب‌شده پس از حداکثر زمان مجاز است";
    return "";
  } catch {
    return "تاریخ و ساعت شمسی معتبر انتخاب کنید";
  }
}
export function dayAllowed(value: CalendarValue, bounds: DateBounds): boolean {
  const first = Date.parse(calendarISO({ ...value, hour: 0, minute: 0 }));
  const last = Date.parse(calendarISO({ ...value, hour: 23, minute: 59 }));
  return last >= bounds.min && first <= bounds.max;
}
export function hourAllowed(value: CalendarValue, bounds: DateBounds): boolean {
  const first = Date.parse(calendarISO({ ...value, minute: 0 }));
  const last = Date.parse(calendarISO({ ...value, minute: 59 }));
  return last >= bounds.min && first <= bounds.max;
}
export function monthAllowed(
  year: number,
  month: number,
  bounds: DateBounds,
): boolean {
  if (year < 1200 || year > 1600) return false;
  const first = Date.parse(
    calendarISO({ year, month, day: 1, hour: 0, minute: 0 }),
  );
  const last = Date.parse(
    calendarISO({
      year,
      month,
      day: monthDays(year, month),
      hour: 23,
      minute: 59,
    }),
  );
  return last >= bounds.min && first <= bounds.max;
}
export function boundedValue(
  value: CalendarValue,
  bounds: DateBounds,
): CalendarValue {
  const time = Date.parse(calendarISO(value));
  const clamped = Math.max(bounds.min, Math.min(bounds.max, time));
  // Round up at the lower boundary so the minute-precision picker can satisfy it.
  return calendarValue(
    "",
    new Date(
      clamped < bounds.min + 60000
        ? Math.ceil(clamped / 60000) * 60000
        : clamped,
    ),
  );
}
export function calendarYears(bounds: DateBounds): number[] {
  const start = Number.isFinite(bounds.min)
    ? calendarValue("", new Date(bounds.min)).year
    : 1200;
  const end = Number.isFinite(bounds.max)
    ? calendarValue("", new Date(bounds.max)).year
    : 1600;
  return Array.from(
    { length: Math.max(0, Math.min(1600, end) - Math.max(1200, start) + 1) },
    (_, n) => Math.max(1200, start) + n,
  );
}
