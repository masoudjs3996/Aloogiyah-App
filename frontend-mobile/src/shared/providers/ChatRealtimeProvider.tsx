import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../design-system/atoms/Text";
import { Button } from "../../design-system/atoms/Button";
import { theme } from "../theme";
import { platformApi, errorMessage, request } from "../../api/platform";
import type { Message } from "../types/platform";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, useProfile } from "./AuthProvider";
import { session } from "../../api/session";
import { refreshToken } from "../../api/http";
import { SOCKET_BASE } from "../../api/config";
import { mergeChatMessage } from "../utils/chat";
import { shouldShowChatNotice } from "../utils/chat-notifications";
import { notificationModule, registerPush } from "../notifications";
const Context = createContext({
  connected: false,
  room: undefined as string | undefined,
  peerOnline: null as boolean | null,
  setRoom: (_room: string | undefined) => {},
});
export const useRealtimeChat = () => useContext(Context);
export function ChatRealtimeProvider({
  children,
  openConversation,
}: {
  children: React.ReactNode;
  openConversation: (room: string, title?: string) => void;
}) {
  const signedIn = useAuth().signedIn;
  const profile = useProfile();
  const me = profile.data?.user?.code || "";
  const client = useQueryClient();
  const [room, setRoom] = useState<string>();
  const [notice, setNotice] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();
  const seen = useRef(new Set<string>());
  const currentRoom = useRef(room);
  currentRoom.current = room;
  const navigate = useRef(openConversation);
  navigate.current = openConversation;
  useEffect(() => {
    if (!signedIn || !me) return;
    let disposed = false;
    const listeners: { remove: () => void }[] = [];
    const sync = () => {
      void registerPush(false).catch(() => {});
    };
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    void (async () => {
      const notifications = await notificationModule();
      if (!notifications || disposed) return;
      await notifications.setNotificationCategoryAsync("chat", [
        {
          identifier: "read",
          buttonTitle: "خوانده‌شدن پیام",
          options: { opensAppToForeground: true },
        },
      ]);
      const messageFrom = async (data: Record<string, unknown> = {}) => {
        if (
          data.type !== "chat" ||
          data.receiverCode !== me ||
          typeof data.messageCode !== "string"
        )
          return;
        const message = await request<Message>("/ChatMessage/GetByCode", {
          params: { code: data.messageCode },
        });
        if (disposed || message.receiverCode !== me) return;
        return message;
      };
      listeners.push(
        notifications.addNotificationReceivedListener((notification) => {
          void (async () => {
            const message = await messageFrom(
              notification.request.content.data,
            );
            if (
              !shouldShowChatNotice(message, me, currentRoom.current, true) ||
              !message ||
              seen.current.has(message.code)
            )
              return;
            seen.current.add(message.code);
            if (
              client.getQueryState(["chat", "room", message.conversationCode])
            )
              mergeChatMessage(client, message);
            setNotice(message);
            await client.invalidateQueries({ queryKey: ["chat"] });
          })().catch(() => {});
        }),
      );
      const respond = async (
        response: import("expo-notifications").NotificationResponse,
      ) => {
        const message = await messageFrom(
          response.notification.request.content.data,
        );
        if (!message || message.isDeleted) return;
        if (response.actionIdentifier === "read") {
          try {
            await platformApi.markMessageRead(message);
            await client.invalidateQueries({ queryKey: ["chat"] });
          } catch {
            setNotice(message);
            setError("خوانده‌شدن ثبت نشد؛ دوباره تلاش کنید");
          }
        } else navigate.current(message.conversationCode, message.senderName);
        await notifications.dismissNotificationAsync(
          response.notification.request.identifier,
        );
        await notifications.clearLastNotificationResponseAsync();
      };
      if (disposed) return;
      listeners.push(
        notifications.addNotificationResponseReceivedListener((response) => {
          void respond(response).catch(() => {});
        }),
      );
      const last = await notifications.getLastNotificationResponseAsync();
      listeners.push(notifications.addPushTokenListener(() => sync()));
      if (last && !disposed) await respond(last);
      if (!disposed) sync();
    })().catch(() => {});
    return () => {
      disposed = true;
      appState.remove();
      listeners.forEach((listener) => listener.remove());
    };
  }, [signedIn, me, client]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 12000);
    return () => clearTimeout(timer);
  }, [notice]);
  const [online, setOnline] = useState(false);
  const [presence, setPresence] = useState<{ room: string; online: boolean }>();
  useEffect(() => {
    if (!session.get() || !signedIn || !me) {
      setNotice(null);
      seen.current.clear();
      return;
    }
    let disposed = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let delay = 1000;
    let connectionEpoch = 0;
    const stop = () => {
      connectionEpoch++;
      if (retry) clearTimeout(retry);
      if (heartbeat) clearInterval(heartbeat);
      if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
      }
      setOnline(false);
      setPresence(undefined);
    };
    const notify = async (message: Message) => {
      if (
        AppState.currentState !== "active" ||
        !shouldShowChatNotice(message, me, room, true) ||
        seen.current.has(message.code)
      )
        return;
      seen.current.add(message.code);
      if (seen.current.size > 500)
        seen.current.delete(seen.current.values().next().value!);
      let senderName = message.senderName?.trim();
      if (!senderName) {
        try {
          senderName = (await platformApi.chatContact(message.senderCode))
            .displayName;
        } catch {}
      }
      if (!disposed) {
        setError("");
        setNotice({ ...message, senderName: senderName || "یکی از مخاطبان" });
      }
    };
    const connect = async () => {
      if (disposed || AppState.currentState !== "active") return;
      const attempt = ++connectionEpoch;
      let token = session.get()?.token;
      if (!token) return;
      try {
        const jwt = token.replace(/^\s*Bearer\s+/i, "").trim();
        const expires = (() => {
          try {
            return (
              JSON.parse(
                atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
              ).exp * 1000
            );
          } catch {
            return 0;
          }
        })();
        if (expires < Date.now() + 60000) token = await refreshToken();
      } catch {
        if (
          !disposed &&
          attempt === connectionEpoch &&
          AppState.currentState === "active"
        ) {
          retry = setTimeout(connect, delay);
          delay = Math.min(delay * 2, 15000);
        }
        return;
      }
      if (
        disposed ||
        attempt !== connectionEpoch ||
        AppState.currentState !== "active"
      )
        return;
      socket = new WebSocket(
        `${SOCKET_BASE}?access_token=${encodeURIComponent(token.replace(/^\s*Bearer\s+/i, "").trim())}`,
      );
      socket.onopen = () => {
        if (disposed || attempt !== connectionEpoch) return;
        setOnline(true);
        delay = 1000;
        if (room)
          socket?.send(
            JSON.stringify({
              type: "presence.subscribe",
              conversationCode: room,
            }),
          );
        client.invalidateQueries({ queryKey: ["chat"] });
        heartbeat = setInterval(() => {
          if (socket?.readyState === 1) socket.send("ping");
        }, 25000);
      };
      socket.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (disposed || attempt !== connectionEpoch) return;
          if (
            payload.type === "presence.changed" &&
            payload.data?.conversationCode === room &&
            typeof payload.data?.isOnline === "boolean"
          ) {
            setPresence({
              room: payload.data.conversationCode,
              online: payload.data.isOnline,
            });
          }
          if (payload.type === "message.received") {
            if (
              client.getQueryState([
                "chat",
                "room",
                payload.data.conversationCode,
              ])
            )
              mergeChatMessage(client, payload.data);
            if (payload.data.isRead || payload.data.isDeleted)
              setNotice((current) =>
                current?.code === payload.data.code ? null : current,
              );
            else void notify(payload.data);
          }
          if (
            ["message.received", "conversation.created"].includes(payload.type)
          )
            client.invalidateQueries({ queryKey: ["chat"] });
        } catch {}
      };
      socket.onerror = () => {
        if (attempt === connectionEpoch) socket?.close();
      };
      socket.onclose = () => {
        if (disposed || attempt !== connectionEpoch) return;
        setOnline(false);
        setPresence(undefined);
        if (heartbeat) clearInterval(heartbeat);
        if (!disposed && AppState.currentState === "active") {
          retry = setTimeout(connect, delay);
          delay = Math.min(delay * 2, 15000);
        }
      };
    };
    connect();
    const sub = AppState.addEventListener("change", (state) => {
      stop();
      if (state === "active") connect();
    });
    return () => {
      disposed = true;
      stop();
      sub.remove();
    };
  }, [client, room, signedIn, me]);
  return (
    <Context.Provider
      value={{
        connected: online,
        room,
        setRoom,
        peerOnline:
          online && presence && presence.room === room ? presence.online : null,
      }}
    >
      {children}
      {signedIn && notice && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            right: 12,
            maxWidth: 500,
            alignSelf: "center",
            backgroundColor: "white",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            zIndex: 1000,
            elevation: 12,
            boxShadow: "0 4px 20px #0F172A26",
          }}
        >
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text bold style={{ flex: 1 }}>
              پیام جدید از {notice.senderName}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="بستن اعلان پیام"
              onPress={() => setNotice(null)}
              style={{ padding: 8 }}
            >
              <Text>×</Text>
            </Pressable>
          </View>
          <Text numberOfLines={2} muted style={{ fontSize: 12 }}>
            {notice.attachmentName
              ? `فایل: ${notice.attachmentName}`
              : notice.message}
          </Text>
          <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 12 }}>
            <Button
              compact
              title="باز کردن گفتگو"
              onPress={() => {
                const item = notice;
                setNotice(null);
                openConversation(item.conversationCode, item.senderName);
              }}
            />
            <Button
              compact
              outline
              title="خوانده‌شدن پیام"
              busy={busy}
              onPress={async () => {
                setBusy(true);
                setError("");
                try {
                  await platformApi.markMessageRead(notice);
                  setNotice((current) =>
                    current?.code === notice.code ? null : current,
                  );
                  await client.invalidateQueries({ queryKey: ["chat"] });
                } catch (error) {
                  setError(errorMessage(error));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </View>
          {!!error && (
            <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text>
          )}
        </View>
      )}
    </Context.Provider>
  );
}
