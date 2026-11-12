import { AppModal as Modal } from "./AppModal";
import React, { useState } from "react";
import {
  FlatList,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Text } from "../atoms/Text";
import { Field } from "../atoms/Field";
import { Button } from "../atoms/Button";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../shared/theme";
export function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  error,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; leading?: React.ReactNode }[];
  disabled?: boolean;
  required?: boolean;
  error?: string;
}) {
  const insets = useSafeAreaInsets();
  const normalize = (text: string) =>
    text.replace(/ي/g, "ی").replace(/ك/g, "ک").trim().toLocaleLowerCase();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find(option => option.value === value);
  return (
    <View style={{ marginBottom: 12, gap: 5 }}>
      <Text bold>
        {label}
        {required && <Text style={{ color: theme.danger }}> *</Text>}
      </Text>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: open }}
        onPress={() => {
          Keyboard.dismiss();
          setSearch("");
          setOpen(true);
        }}
        style={{
          padding: 13,
          minHeight: 50,
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 8,
          backgroundColor: "white",
          borderRadius: 13,
          borderWidth: 1,
          borderColor: error ? theme.danger : theme.border,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {selected?.leading}
        <Text style={{ flex: 1, minWidth: 0 }}>
          {selected?.label || "انتخاب کنید"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.muted} />
      </Pressable>
      {!!error && <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text>}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            backgroundColor: "#0008",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              height: "80%",
              padding: 20,
              paddingBottom: Math.max(16, insets.bottom),
              paddingTop: Math.max(20, insets.top),
              width: "100%",
              maxWidth: 600,
              alignSelf: "center",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: theme.bg,
            }}
          >
            <Field
              label={label}
              value={search}
              onChangeText={setSearch}
              placeholder="جست‌وجو"
            />
            <FlatList
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListEmptyComponent={<Text muted>نتیجه‌ای پیدا نشد</Text>}
              data={options.filter((o) =>
                normalize(o.label).includes(normalize(search)),
              )}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: item.value === value }}
                  onPress={() => {
                    onChange(item.value);
                    Keyboard.dismiss();
                    setOpen(false);
                    setSearch("");
                  }}
                  style={{
                    padding: 15,
                    backgroundColor:
                      item.value === value ? theme.mint : undefined,
                    borderRadius: 12,
                    borderBottomWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  {item.leading ? <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                    {item.leading}<Text bold={item.value === value} style={{ flex: 1 }}>{item.label}</Text>
                  </View> : <Text bold={item.value === value}>{item.label}</Text>}
                </Pressable>
              )}
            />
            <Button outline title="بستن" onPress={() => setOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
