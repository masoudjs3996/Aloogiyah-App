import React, { useState } from "react";
import { Pressable, View, TextInput, type TextInputProps } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "./Text";
import { theme } from "../../shared/theme";
export function Field({
  label,
  error,
  icon,
  trailingAction,
  style,
  secureTextEntry,
  required = false,
  prefix,
  hint,
  ...props
}: TextInputProps & {
  label: string;
  required?: boolean;
  prefix?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  trailingAction?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const action = secureTextEntry ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        passwordVisible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
      }
      onPress={() => setPasswordVisible((visible) => !visible)}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={passwordVisible ? "eye-outline" : "eye-off-outline"}
        size={22}
        color={theme.muted}
      />
    </Pressable>
  ) : (
    trailingAction
  );
  return (
    <View style={{ gap: 5, marginBottom: 12 }}>
      <Text bold>
        {label}
        {required && <Text style={{ color: theme.danger }}> *</Text>}
      </Text>
      <View style={{ position: "relative" }}>
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry && !passwordVisible}
          autoCapitalize={secureTextEntry ? "none" : props.autoCapitalize}
          autoCorrect={secureTextEntry ? false : props.autoCorrect}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          accessibilityLabel={props.accessibilityLabel || label}
          placeholderTextColor={theme.muted}
          style={[
            {
              fontFamily: "Vazir",
              textAlign: "right",
              color: theme.ink,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: error
                ? theme.danger
                : focused
                  ? theme.green
                  : theme.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingRight: icon || (!secureTextEntry && action) ? 52 : 12,
              paddingLeft: secureTextEntry ? 52 : prefix ? 48 : 12,
              paddingVertical: 10,
              fontSize: 14,
              boxShadow: focused ? "0 0 0 2px #D1FAE5" : undefined,
              minHeight: 48,
            },
            props.multiline && { minHeight: 110, textAlignVertical: "top" },
            style,
          ]}
        />
        {prefix && (
          <View
            pointerEvents="none"
            accessible={false}
            style={{
              position: "absolute",
              left: 12,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            <Text bold style={{ writingDirection: "ltr", color: theme.muted }}>
              {prefix}
            </Text>
          </View>
        )}
        {icon && (
          <View
            pointerEvents="none"
            accessible={false}
            style={{ position: "absolute", right: 12, top: 12 }}
          >
            {icon}
          </View>
        )}
        {action && (
          <View
            style={{
              position: "absolute",
              ...(secureTextEntry ? { left: 2 } : { right: 2 }),
              top: 2,
              bottom: 2,
              justifyContent: "center",
            }}
          >
            {action}
          </View>
        )}
      </View>
      {hint && !error && (
        <Text muted style={{ fontSize: 12, lineHeight: 22 }}>
          {hint}
        </Text>
      )}
      {error && (
        <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text>
      )}
    </View>
  );
}
