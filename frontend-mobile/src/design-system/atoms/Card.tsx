import React from "react";
import { View, type ViewProps } from "react-native";
import { theme } from "../../shared/theme";
export function Card({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: "white",
          borderRadius: theme.radius,
          borderWidth: 1,
          borderColor: theme.border,
          padding: 16,
          minWidth: 0,
          gap: 10,
          marginBottom: 12,
          boxShadow: "0px 2px 6px rgba(15,23,42,0.03)",
        },
        style,
      ]}
    />
  );
}
