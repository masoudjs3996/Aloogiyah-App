import React from "react";
import { Pressable, ActivityIndicator, type ViewStyle } from "react-native";
import { Text } from "./Text";
import { theme } from "../../shared/theme";
export function Button({
  title,
  onPress,
  busy,
  disabled,
  outline = false,
  style,
  icon,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  outline?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(busy || disabled), busy: !!busy }}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          borderRadius: 12,
          paddingVertical: compact ? 8 : 13,
          paddingHorizontal: compact ? 10 : 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: outline ? theme.white : theme.green,
          borderWidth: 1,
          borderColor: outline ? theme.border : theme.green,
          opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1,
          minHeight: compact ? 40 : 48,
          flexDirection: "row-reverse",
          gap: 8,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={outline ? theme.green : "white"} />
      ) : (
        <>
          {icon}
          <Text
            bold
            style={{
              color: outline ? theme.green : "white",
              textAlign: "center",
              flexShrink: 1,
              fontSize: compact ? 12 : 13,
              lineHeight: compact ? 20 : 25,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
