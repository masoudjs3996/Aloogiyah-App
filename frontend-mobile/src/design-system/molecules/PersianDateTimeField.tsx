import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Select } from "./Select";
import { Button } from "../atoms/Button";
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
} from "../../shared/utils/persian-calendar";
import { Field } from "../atoms/Field";
import { Text } from "../atoms/Text";

export function PersianDateTimeField({
  label,
  value,
  onChangeText,
  hint,
  min,
  max,
  futureOnly,
  maxDaysAhead,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  hint?: string;
} & DateRules) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => calendarValue(value));
  const [error, setError] = useState("");
  const rules = { min, max, futureOnly, maxDaysAhead };
  const bounds = dateBounds(rules);
  const choose = (next: typeof draft) => {
    setDraft(boundedValue(next, dateBounds(rules)));
    setError("");
  };
  return (
    <View style={{ marginBottom: 12 }}>
      <Field
        label={`${label} (شمسی)`}
        value={value}
        onChangeText={onChangeText}
        placeholder="۱۴۰۵/۰۷/۲۵ ۱۴:۳۰"
        maxLength={16}
        autoCapitalize="none"
        style={{ textAlign: "left", writingDirection: "ltr" }}
        error={dateError(value, rules)}
        trailingAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="انتخاب تاریخ و ساعت"
            accessibilityState={{ expanded: open }}
            style={{
              width: 44,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => {
              setDraft(boundedValue(calendarValue(value), dateBounds(rules)));
              setError("");
              setOpen(!open);
            }}
          >
            <Ionicons name="calendar-outline" size={22} color="#047857" />
          </Pressable>
        }
      />
      {maxDaysAhead !== undefined && (
        <Text muted style={{ fontSize: 12 }}>
          از امروز تا {digits(maxDaysAhead)} روز آینده
        </Text>
      )}
      {open && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#a7f3d0",
            backgroundColor: "white",
            borderRadius: 16,
            padding: 10,
            gap: 12,
            marginTop: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              compact
              outline
              title="ماه قبل"
              disabled={
                !monthAllowed(
                  moveMonth(draft, -1).year,
                  moveMonth(draft, -1).month,
                  bounds,
                )
              }
              onPress={() => choose(moveMonth(draft, -1))}
            />
            <Text bold accessibilityLiveRegion="polite">
              {months[draft.month - 1]} {digits(draft.year)}
            </Text>
            <Button
              compact
              outline
              title="ماه بعد"
              disabled={
                !monthAllowed(
                  moveMonth(draft, 1).year,
                  moveMonth(draft, 1).month,
                  bounds,
                )
              }
              onPress={() => choose(moveMonth(draft, 1))}
            />
          </View>
          <View style={{ flexDirection: "row-reverse", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Select
                label="ماه"
                value={String(draft.month)}
                options={months.flatMap((month, n) =>
                  monthAllowed(draft.year, n + 1, bounds)
                    ? [{ value: String(n + 1), label: month }]
                    : [],
                )}
                onChange={(month) =>
                  choose(moveMonth(draft, Number(month) - draft.month))
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Select
                label="سال"
                value={String(draft.year)}
                options={calendarYears(bounds).map((year) => ({
                  value: String(year),
                  label: digits(year),
                }))}
                onChange={(year) =>
                  choose(moveMonth(draft, (Number(year) - draft.year) * 12))
                }
              />
            </View>
          </View>
          <View style={{ flexDirection: "row-reverse" }}>
            {weekdays.map((day, index) => (
              <Text
                key={index}
                muted
                style={{ width: "14.2857%", textAlign: "center" }}
              >
                {day}
              </Text>
            ))}
          </View>
          {Array.from(
            { length: monthCells(draft.year, draft.month).length / 7 },
            (_, row) => (
              <View key={row} style={{ flexDirection: "row-reverse" }}>
                {monthCells(draft.year, draft.month)
                  .slice(row * 7, row * 7 + 7)
                  .map((day, index) => (
                    <View key={index} style={{ width: "14.2857%", padding: 1 }}>
                      {day !== null && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            digits(day) +
                            " " +
                            months[draft.month - 1] +
                            " " +
                            digits(draft.year)
                          }
                          disabled={!dayAllowed({ ...draft, day }, bounds)}
                          accessibilityState={{
                            selected: draft.day === day,
                            disabled: !dayAllowed({ ...draft, day }, bounds),
                          }}
                          onPress={() => {
                            choose({ ...draft, day });
                          }}
                          style={{
                            minHeight: 44,
                            opacity: dayAllowed({ ...draft, day }, bounds)
                              ? 1
                              : 0.3,
                            justifyContent: "center",
                            borderRadius: 8,
                            backgroundColor:
                              draft.day === day ? "#047857" : "#f8fafc",
                          }}
                        >
                          <Text
                            style={{
                              textAlign: "center",
                              color: draft.day === day ? "white" : "#0f172a",
                            }}
                          >
                            {digits(day)}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
              </View>
            ),
          )}
          {(["hour", "minute"] as const).map((part) => (
            <View key={part} style={{ gap: 4 }}>
              <Text bold>
                {part === "hour" ? "ساعت" : "دقیقه"}:{" "}
                {digits(draft[part]).padStart(2, "۰")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                contentContainerStyle={{ gap: 4 }}
                keyboardShouldPersistTaps="handled"
              >
                {Array.from({ length: part === "hour" ? 24 : 60 }, (_, n) => (
                  <Pressable
                    key={n}
                    accessibilityRole="button"
                    accessibilityLabel={
                      (part === "hour" ? "ساعت " : "دقیقه ") + digits(n)
                    }
                    accessibilityState={{ selected: draft[part] === n }}
                    disabled={
                      part === "hour"
                        ? !hourAllowed({ ...draft, hour: n }, bounds)
                        : !!dateError(
                            calendarInput({ ...draft, minute: n }),
                            rules,
                          )
                    }
                    onPress={() => {
                      choose({ ...draft, [part]: n });
                    }}
                    style={{
                      minWidth: 44,
                      opacity: (
                        part === "hour"
                          ? hourAllowed({ ...draft, hour: n }, bounds)
                          : !dateError(
                              calendarInput({ ...draft, minute: n }),
                              rules,
                            )
                      )
                        ? 1
                        : 0.3,
                      minHeight: 44,
                      justifyContent: "center",
                      borderRadius: 8,
                      backgroundColor:
                        draft[part] === n ? "#047857" : "#f1f5f9",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: draft[part] === n ? "white" : "#0f172a",
                      }}
                    >
                      {digits(n).padStart(2, "۰")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
          <Text style={{ textAlign: "center" }}>
            {calendarInput(draft).replace(/[0-9]/g, (n) => digits(Number(n)))}
          </Text>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: "#dc2626" }}>
              {error}
            </Text>
          )}
          <View style={{ flexDirection: "row-reverse", gap: 8 }}>
            <Button
              compact
              outline
              title="امروز"
              onPress={() => {
                choose(calendarValue(""));
              }}
            />
            <Button
              compact
              outline
              title="انصراف"
              onPress={() => setOpen(false)}
            />
            <Button
              compact
              title="تأیید"
              style={{ flex: 1 }}
              onPress={() => {
                try {
                  calendarISO(draft);
                  const invalid = dateError(calendarInput(draft), rules);
                  if (invalid) {
                    setError(invalid);
                    return;
                  }
                  onChangeText(calendarInput(draft));
                  setOpen(false);
                } catch {
                  setError("تاریخ یا ساعت انتخاب‌شده معتبر نیست");
                }
              }}
            />
          </View>
        </View>
      )}
      <Text muted style={{ fontSize: 12 }}>
        {hint ||
          "تاریخ را از تقویم شمسی انتخاب کنید و ساعت و دقیقه را مشخص کنید."}
      </Text>
    </View>
  );
}
