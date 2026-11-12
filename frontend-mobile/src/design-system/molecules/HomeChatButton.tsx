import React from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Routes } from "../../navigation/types";
import { useUnreadChatCount } from "../../shared/hooks/useUnreadChatCount";
import { useAuth } from "../../shared/providers/AuthProvider";
import { UnreadChatBadge } from "./UnreadChatBadge";
export function HomeChatButton() {
  const navigation = useNavigation<NativeStackNavigationProp<Routes>>();
  const { signedIn } = useAuth();
  const count = useUnreadChatCount();
  if (!signedIn) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        count
          ? `گفت‌وگوها، ${count.toLocaleString("fa-IR")} پیام خوانده‌نشده`
          : "گفت‌وگوها"
      }
      onPress={() => navigation.navigate("Chat")}
      style={{
        width: 40,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View>
        <Ionicons name="chatbubbles-outline" size={24} color="#047857" />
        <UnreadChatBadge count={count} />
      </View>
    </Pressable>
  );
}
