import { usePollingInterval } from "../../shared/hooks/usePollingInterval";
import React from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import type { Routes } from "../../navigation/types";
import { api } from "../../api/mobile";
import { useAuth } from "../../shared/providers/AuthProvider";
import { theme } from "../../shared/theme";
import { number } from "../../shared/utils/format";
import { Text } from "../atoms/Text";
import { HomeChatButton } from "./HomeChatButton";

export function HomeNotificationsButton() {
  const navigation = useNavigation<NativeStackNavigationProp<Routes>>();
  const { signedIn } = useAuth();
  const focused = useIsFocused();
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications,
    enabled: signedIn && focused,
    refetchInterval: usePollingInterval(signedIn && focused ? 60000 : false),
  });
  const unread =
    signedIn && !notifications.isError
      ? (notifications.data?.filter((notice) => !notice.isRead).length ?? 0)
      : 0;
  if (!signedIn) return null;
  return (
    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
      <HomeChatButton />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          unread > 0
            ? `اعلان‌ها، ${number(unread)} اعلان خوانده‌نشده`
            : "اعلان‌ها"
        }
        onPress={() => navigation.navigate("Notifications")}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: pressed ? theme.mint : theme.white,
        })}
      >
        <Ionicons name="notifications-outline" size={24} color={theme.green} />
        {unread > 0 && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 3,
              borderRadius: 9,
              backgroundColor: theme.danger,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              bold
              style={{
                color: theme.white,
                fontSize: 9,
                lineHeight: 16,
                textAlign: "center",
              }}
            >
              {unread > 99 ? "۹۹+" : number(unread)}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
