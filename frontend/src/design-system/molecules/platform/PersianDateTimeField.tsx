"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import {
  calendarValue,
  calendarInput,
  calendarISO,
  monthCells,
  moveMonth,
  months,
  weekdays,
  digits,
  dateBounds,
  dateError,
  dayAllowed,
  hourAllowed,
  monthAllowed,
  boundedValue,
  calendarYears,
  type DateRules,
} from "@/shared/utils/persian-calendar";
import Input from "@/design-system/atoms/Input";
import { Field } from "./FormField";
export default function PersianDateTimeField({
  label,
  value,
  onChange,
  required = false,
  hint,
  min,
  max,
  futureOnly,
  maxDaysAhead,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
} & DateRules) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => calendarValue(value));
  const [pickerError, setPickerError] = useState("");
  const rules = { min, max, futureOnly, maxDaysAhead };
  const bounds = dateBounds(rules);
  const choose = (next: typeof draft) => {
    setDraft(boundedValue(next, dateBounds(rules)));
    setPickerError("");
  };
  const button =
    "rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40";
  useEffect(() => {
    input.current?.setCustomValidity(
      dateError(value, { min, max, futureOnly, maxDaysAhead }),
    );
  }, [value, min, max, futureOnly, maxDaysAhead]);
  return (
    <Field
      label={`${label} (شمسی)`}
      htmlFor={id}
      hint={
        hint ||
        "تاریخ را از تقویم شمسی انتخاب کنید و ساعت و دقیقه را مشخص کنید."
      }
    >
      <div className="relative">
        <Input
          ref={input}
          id={id}
          value={value}
          required={required}
          dir="ltr"
          placeholder="۱۴۰۵/۰۷/۲۵ ۱۴:۳۰"
          maxLength={16}
          className="pr-12"
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600"
          aria-label="انتخاب تاریخ و ساعت"
          title="انتخاب تاریخ و ساعت"
          aria-expanded={open}
          aria-controls={id + "-calendar"}
          onClick={() => {
            setDraft(boundedValue(calendarValue(value), dateBounds(rules)));
            setPickerError("");
            setOpen(!open);
          }}
        >
          <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {maxDaysAhead !== undefined && (
        <p className="text-xs text-slate-500">
          از امروز تا {digits(maxDaysAhead)} روز آینده
        </p>
      )}
      {open && (
        <section
          id={id + "-calendar"}
          aria-label={label + "؛ تقویم شمسی"}
          dir="rtl"
          className="w-full max-w-sm space-y-3 rounded-2xl border border-emerald-200 bg-white p-3"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="ماه قبل"
              className={button}
              disabled={
                !monthAllowed(
                  moveMonth(draft, -1).year,
                  moveMonth(draft, -1).month,
                  bounds,
                )
              }
              onClick={() => choose(moveMonth(draft, -1))}
            >
              ‹
            </button>
            <select
              aria-label="ماه"
              className={button + " min-w-0 flex-1"}
              value={draft.month}
              onChange={(event) =>
                choose(
                  moveMonth(draft, Number(event.target.value) - draft.month),
                )
              }
            >
              {months.map((month, n) => (
                <option
                  key={n}
                  value={n + 1}
                  disabled={!monthAllowed(draft.year, n + 1, bounds)}
                >
                  {month}
                </option>
              ))}
            </select>
            <select
              aria-label="سال"
              className={button + " min-w-0 flex-1"}
              value={draft.year}
              onChange={(event) =>
                choose(
                  moveMonth(
                    draft,
                    (Number(event.target.value) - draft.year) * 12,
                  ),
                )
              }
            >
              {calendarYears(bounds).map((year) => (
                <option key={year} value={year}>
                  {digits(year)}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="ماه بعد"
              className={button}
              disabled={
                !monthAllowed(
                  moveMonth(draft, 1).year,
                  moveMonth(draft, 1).month,
                  bounds,
                )
              }
              onClick={() => choose(moveMonth(draft, 1))}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((day, index) => (
              <span key={index} className="py-2 text-xs text-slate-500">
                {day}
              </span>
            ))}
            {monthCells(draft.year, draft.month).map((day, index) =>
              day === null ? (
                <span key={index} />
              ) : (
                <button
                  type="button"
                  key={index}
                  aria-label={
                    digits(day) +
                    " " +
                    months[draft.month - 1] +
                    " " +
                    digits(draft.year)
                  }
                  aria-pressed={draft.day === day}
                  disabled={!dayAllowed({ ...draft, day }, bounds)}
                  className={
                    "min-h-10 rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-30 " +
                    (draft.day === day
                      ? "bg-emerald-700 text-white"
                      : "hover:bg-emerald-50")
                  }
                  onClick={() => {
                    choose({ ...draft, day });
                  }}
                >
                  {digits(day)}
                </button>
              ),
            )}
          </div>
          <div className="flex items-center gap-3">
            {(["hour", "minute"] as const).map((part) => (
              <label
                key={part}
                className="flex flex-1 items-center gap-2 text-sm"
              >
                {part === "hour" ? "ساعت" : "دقیقه"}
                <select
                  aria-label={part === "hour" ? "ساعت" : "دقیقه"}
                  className={button + " min-w-0 flex-1"}
                  value={draft[part]}
                  onChange={(event) => {
                    choose({ ...draft, [part]: Number(event.target.value) });
                  }}
                >
                  {Array.from({ length: part === "hour" ? 24 : 60 }, (_, n) => (
                    <option
                      key={n}
                      value={n}
                      disabled={
                        part === "hour"
                          ? !hourAllowed({ ...draft, hour: n }, bounds)
                          : !!dateError(
                              calendarInput({ ...draft, minute: n }),
                              rules,
                            )
                      }
                    >
                      {digits(n).padStart(2, "۰")}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="text-center text-sm" dir="ltr">
            {calendarInput(draft).replace(/[0-9]/g, (n) => digits(Number(n)))}
          </p>
          {pickerError && (
            <p role="alert" className="text-sm text-red-600">
              {pickerError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              onClick={() => {
                choose(calendarValue(""));
              }}
            >
              امروز
            </button>
            <button
              type="button"
              className={button}
              onClick={() => setOpen(false)}
            >
              انصراف
            </button>
            <button
              type="button"
              className={button + " bg-emerald-50 font-bold text-emerald-800"}
              onClick={() => {
                try {
                  calendarISO(draft);
                  const error = dateError(calendarInput(draft), rules);
                  if (error) {
                    setPickerError(error);
                    return;
                  }
                  onChange(calendarInput(draft));
                  setOpen(false);
                  input.current?.focus();
                } catch {
                  setPickerError("تاریخ یا ساعت انتخاب‌شده معتبر نیست");
                }
              }}
            >
              تأیید تاریخ و ساعت
            </button>
          </div>
        </section>
      )}
    </Field>
  );
}
