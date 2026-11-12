import React from "react";
import { View, Pressable } from "react-native";
import { Select } from "./Select";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
export function MultiSelect({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  required?: boolean;
  value: string[];
  onChange: (codes: string[]) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Select
        label={label}
        required={required}
        options={options.map((option) => ({
          ...option,
          label: `${value.includes(option.value) ? "✓ " : ""}${option.label}`,
        }))}
        onChange={(code) =>
          onChange(
            value.includes(code)
              ? value.filter((c) => c !== code)
              : [...value, code],
          )
        }
      />
      <View style={{ flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" }}>
        {value.map((code) => (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityLabel={`حذف ${options.find((o) => o.value === code)?.label || "دسته انتخاب‌شده"}`}
            onPress={() => onChange(value.filter((c) => c !== code))}
            style={{
              backgroundColor: theme.mint,
              padding: 8,
              minHeight: 44,
              maxWidth: "100%",
              justifyContent: "center",
              borderRadius: 10,
            }}
          >
            <Text>
              {options.find((o) => o.value === code)?.label || code} ×
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
