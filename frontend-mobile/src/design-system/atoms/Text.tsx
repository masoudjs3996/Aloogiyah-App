import React from "react";
import { Text as NativeText, type TextProps } from "react-native";
import { theme } from "../../shared/theme";
export function Text({
  style,
  bold = false,
  muted = false,
  ...props
}: TextProps & { bold?: boolean; muted?: boolean }) {
  return (
    <NativeText
      {...props}
      style={[
        {
          fontFamily: bold ? "VazirBold" : "Vazir",
          fontSize: 14,
          lineHeight: 25,
          color: muted ? theme.muted : theme.ink,
          textAlign: "right",
          writingDirection: "rtl",
        },
        style,
      ]}
    />
  );
}
