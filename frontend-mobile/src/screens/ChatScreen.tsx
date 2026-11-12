import { usePollingInterval } from "../shared/hooks/usePollingInterval";
import React from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { QueryState } from "../design-system/molecules/QueryState";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { useAuth } from "../shared/providers/AuthProvider";
import { useChatSocket } from "../shared/hooks/useChatSocket";
import { chatTime } from "../shared/utils/chat";
import { number } from "../shared/utils/format";
import { theme } from "../shared/theme";
import type { Props } from "../navigation/types";
export function ChatScreen({ navigation }: Props<"Chat">) {
  const signedIn = useAuth().signedIn;
  const { connected } = useChatSocket();
  const q = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: ({ signal }) => platformApi.chatRooms(signal),
    enabled: signedIn,
    refetchInterval: usePollingInterval(15000),
  });
  return (
    <AuthGate>
      <Screen scroll={false}>
        <View style={styles.heading}>
          <View style={styles.headingIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={23}
              color={theme.green}
            />
          </View>
          <Text bold style={{ flex: 1, fontSize: 18 }}>
            مکالمه‌ها
          </Text>
        </View>
        <FlatList
          data={q.data || []}
          keyExtractor={(room) => room.code}
          contentContainerStyle={{ padding: 12, flexGrow: 1 }}
          onRefresh={() => q.refetch()}
          refreshing={q.isRefetching}
          ListHeaderComponent={
            <QueryState
              loading={q.isLoading}
              error={q.error}
              retry={() => q.refetch()}
            />
          }
          ListEmptyComponent={
            !q.isLoading && !q.error ? (
              <View style={styles.empty}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={60}
                  color="#A7F3D0"
                />
                <Text bold>هنوز مکالمه‌ای ندارید</Text>
                <Text muted style={{ textAlign: "center", fontSize: 12 }}>
                  برای شروع، از صفحه محصول یا درخواست خدمات، گفت‌وگو را باز
                  کنید.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item: room }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"گفت‌وگو با " + (room.peerName || "کاربر")}
              onPress={() =>
                navigation.navigate("ChatRoom", {
                  code: room.code,
                  title: room.peerName,
                })
              }
              style={({ pressed }) => [
                styles.contact,
                pressed && { backgroundColor: "#ECFDF5" },
              ]}
            >
              <View style={styles.avatar}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={21}
                  color={theme.green}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <View style={styles.row}>
                  <Text
                    bold
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: 13 }}
                  >
                    {room.peerName || "کاربر"}
                  </Text>
                  <Text muted style={{ fontSize: 10 }}>
                    {chatTime(room.lastMessageAt)}
                  </Text>
                </View>
                {!!(room.farmName || room.productName) && (
                  <Text muted numberOfLines={1} style={{ fontSize: 11 }}>
                    {[room.farmName, room.productName]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                )}
                <View style={styles.row}>
                  <Text
                    muted
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: 12 }}
                  >
                    {room.lastMessage || "گفت‌وگو آمادهٔ پیام است"}
                  </Text>
                  {!!room.unreadCount && room.unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text
                        bold
                        accessibilityLabel={
                          number(room.unreadCount) + " پیام خوانده‌نشده"
                        }
                        style={{ color: "white", fontSize: 10, lineHeight: 21 }}
                      >
                        {room.unreadCount > 99
                          ? "۹۹+"
                          : number(room.unreadCount)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            q.data?.length ? (
              <View style={{ alignItems: "center", padding: 16 }}>
                <Text muted style={{ fontSize: 10 }}>
                  {connected ? "متصل" : "در حال اتصال"}
                </Text>
              </View>
            ) : null
          }
        />
      </Screen>
    </AuthGate>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  heading: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    backgroundColor: "white",
  },
  headingIcon: { backgroundColor: "#ECFDF5", borderRadius: 12, padding: 10 },
  contact: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "white",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
    marginTop: 60,
  },
});
export { ChatRoomScreen } from "./ChatRoomScreen";
