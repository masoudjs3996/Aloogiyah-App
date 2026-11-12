import React from "react";
import { View } from "react-native";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
export function RegistrationHeading({
  title,
  description,
  large = false,
}: {
  title: string;
  description?: string;
  large?: boolean;
}) {
  return (
    <View
      style={{
        gap: 4,
        paddingBottom: 12,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}
    >
      <Text
        bold
        style={{
          fontSize: large ? 22 : 16,
          lineHeight: large ? 34 : 28,
          color: large ? theme.ink : theme.green,
        }}
      >
        {title}
      </Text>
      {description && (
        <Text muted style={{ lineHeight: 24 }}>
          {description}
        </Text>
      )}
    </View>
  );
}
