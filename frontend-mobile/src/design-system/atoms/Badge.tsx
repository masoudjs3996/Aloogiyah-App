import React from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { theme } from "../../shared/theme";
export function Badge({ title }: { title: string }) {
  return (
    <View
      style={{
        backgroundColor: theme.mint,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9,
        alignSelf: "flex-end",
      }}
    >
      <Text style={{ fontSize: 12, color: theme.green }}>{title}</Text>
    </View>
  );
}
