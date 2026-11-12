import React from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import { UnreadChatBadge } from "./UnreadChatBadge";
export type ServiceTile = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  unreadCount?: number;
};
export function ServiceGrid({
  title,
  items,
  color = theme.green,
  background = theme.mint,
}: {
  title: string;
  items: ServiceTile[];
  color?: string;
  background?: string;
}) {
  if (!items.length) return null;
  return (
    <View style={{ marginBottom: 24 }}>
      <Text bold style={{ fontSize: 17, marginBottom: 14 }}>
        {title}
      </Text>
      <View
        style={{
          flexDirection: "row-reverse",
          flexWrap: "wrap",
          marginHorizontal: -4,
        }}
      >
        {items.map((item) => (
          <View key={item.label} style={{ width: "33.3333%", padding: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                item.unreadCount
                  ? `${item.label}، ${item.unreadCount.toLocaleString("fa-IR")} پیام خوانده‌نشده`
                  : item.label
              }
              onPress={item.onPress}
              style={({ pressed }) => ({
                minHeight: 128,
                backgroundColor: theme.white,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                paddingHorizontal: 5,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: background,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={24} color={color} />
                <UnreadChatBadge count={item.unreadCount || 0} />
              </View>
              <Text
                bold
                numberOfLines={2}
                style={{ fontSize: 11, lineHeight: 20, textAlign: "center" }}
              >
                {item.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
