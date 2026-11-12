import React from "react";
import { View } from "react-native";
import { Text } from "../atoms/Text";
export function UnreadChatBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityLabel={`${count.toLocaleString("fa-IR")} پیام خوانده‌نشده`}
      style={{
        position: "absolute",
        top: -3,
        right: -3,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: 9,
        backgroundColor: "#EF4444",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        bold
        style={{
          color: "white",
          fontSize: 9,
          lineHeight: 16,
          writingDirection: "ltr",
        }}
      >
        {count > 99 ? "۹۹+" : count.toLocaleString("fa-IR")}
      </Text>
    </View>
  );
}
