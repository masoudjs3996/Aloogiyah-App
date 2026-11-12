"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast, { type Toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import type { Message } from "@/shared/types/platform";
import { platformApi, errorMessage } from "@/lib/actions/platform";
import { shouldShowChatNotice } from "@/shared/utils/chat-notifications";

function MessageNotice({
  message,
  senderName,
  dismiss,
  open,
}: {
  message: Message;
  senderName: string;
  dismiss: () => void;
  open: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const client = useQueryClient();
  const latestMessage = useRef(message.code);
  latestMessage.current = message.code;
  return (
    <div
      role="status"
      className="w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-emerald-100 bg-white p-4 text-right shadow-xl"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-900">
          پیام جدید از {senderName}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="بستن اعلان پیام"
          className="px-2 text-slate-400"
        >
          ×
        </button>
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-600">
        {message.attachmentName
          ? `فایل: ${message.attachmentName}`
          : message.message}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            dismiss();
            open();
          }}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
        >
          باز کردن گفتگو
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await platformApi.markMessageRead(message);
              await client.invalidateQueries({
                queryKey: ["platform", "chat-rooms"],
              });
              await client.invalidateQueries({
                queryKey: [
                  "platform",
                  "conversation",
                  message.conversationCode,
                ],
              });
              if (latestMessage.current === message.code) dismiss();
            } catch (error) {
              setError(errorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "در حال ثبت…" : "خوانده‌شدن پیام"}
        </button>
        {"Notification" in window && Notification.permission === "default" && (
          <button
            type="button"
            className="text-xs text-slate-500"
            onClick={() => {
              void Notification.requestPermission().catch(() =>
                setError("مجوز اعلان مرورگر فعال نشد"),
              );
            }}
          >
            فعال‌کردن اعلان مرورگر
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ChatRealtimeProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const profile = usePlatformProfile();
  const me = profile.data?.user?.code || "";
  const client = useQueryClient();
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const activeConversation = useRef("");
  const notifiedConversations = useRef(new Set<string>());
  const socketRef = useRef<WebSocket | null>(null);
  const subscribedRooms = useRef(new Set<string>());

  useEffect(() => {
    const handleActiveConversation = (event: Event) => {
      const receiver = (event as CustomEvent<string>).detail || "";
      activeConversation.current = receiver;
      if (receiver) toast.dismiss(`chat-${receiver}`);
    };
    window.addEventListener("aloogiyah:chat-active", handleActiveConversation);
    return () =>
      window.removeEventListener(
        "aloogiyah:chat-active",
        handleActiveConversation,
      );
  }, []);

  useEffect(() => {
    const handlePresenceSubscription = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          action: "subscribe" | "unsubscribe";
          conversationCode: string;
        }>
      ).detail;
      if (!detail?.conversationCode) return;
      if (detail.action === "subscribe")
        subscribedRooms.current.add(detail.conversationCode);
      else subscribedRooms.current.delete(detail.conversationCode);
      if (socketRef.current?.readyState === WebSocket.OPEN)
        socketRef.current.send(
          JSON.stringify({
            type: `presence.${detail.action}`,
            conversationCode: detail.conversationCode,
          }),
        );
    };
    window.addEventListener(
      "aloogiyah:chat-room-presence",
      handlePresenceSubscription,
    );
    return () =>
      window.removeEventListener(
        "aloogiyah:chat-room-presence",
        handlePresenceSubscription,
      );
  }, []);

  useEffect(() => {
    if (!me || typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("aloogiyah:chat-socket", { detail: false }),
    );
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let retryDelay = 1000;
    let disposed = false;

    const openConversation = (message: Message) => {
      const receiverCode = message.senderCode;
      const receiverName = message.senderName || "فروشنده";
      const contextName =
        message.senderFarmName || message.senderProductName || "";
      const contextType = message.senderFarmName
        ? "گلخانه"
        : message.senderProductName
          ? "محصول"
          : "";
      const params = message.conversationCode
        ? new URLSearchParams({ room: message.conversationCode })
        : new URLSearchParams({
            receiver: receiverCode,
            receiverName,
            contextName,
            contextType,
          });
      router.push(`/dashboard/chat?${params.toString()}`);
      window.focus();
    };

    const showNotification = async (message: Message) => {
      if (
        !shouldShowChatNotice(
          message,
          me,
          activeConversation.current,
          document.visibilityState === "visible" && document.hasFocus(),
        )
      )
        return;
      const senderCode = message.senderCode;
      const conversationKey = message.conversationCode || senderCode;
      if (notifiedConversations.current.has(message.code)) return;
      notifiedConversations.current.add(message.code);
      if (notifiedConversations.current.size > 500)
        notifiedConversations.current.delete(
          notifiedConversations.current.values().next().value!,
        );
      let senderName = message.senderName?.trim();
      if (!senderName) {
        try {
          senderName = (await platformApi.chatContact(senderCode)).displayName;
        } catch {
          /* The message still has a conversation link if contact lookup fails. */
        }
      }
      senderName = senderName?.trim() || "یکی از مخاطبان";
      if (
        disposed ||
        (activeConversation.current === conversationKey &&
          document.visibilityState === "visible" &&
          document.hasFocus())
      )
        return;

      if (
        document.visibilityState !== "visible" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notification = new Notification(`پیام جدید از ${senderName}`, {
            body: message.attachmentName
              ? `فایل: ${message.attachmentName}`
              : message.message.slice(0, 200),
            tag: `chat-${conversationKey}`,
          });
          notification.onclick = () => {
            openConversation(message);
            notification.close();
          };
          return;
        } catch {
          /* Some mobile browsers require a service worker; keep the in-page notice available. */
        }
      }

      toast.custom(
        (item: Toast) => (
          <MessageNotice
            message={message}
            senderName={senderName!}
            dismiss={() => toast.dismiss(item.id)}
            open={() => openConversation(message)}
          />
        ),
        { duration: 12000, id: `chat-${conversationKey}` },
      );
    };

    const connect = () => {
      // Auth responses may store the full HTTP Authorization value in this cookie.
      // WebSocket access_token must contain the JWT only, without the Bearer scheme.
      const token = Cookies.get("token")
        ?.replace(/^\s*Bearer\s+/i, "")
        .trim();
      if (!token || disposed) {
        retryTimer = setTimeout(connect, 3000);
        return;
      }
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const apiBase = (
        process.env.NEXT_PUBLIC_CHAT_SOCKET_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        ""
      )
        .replace(/\/+$/, "")
        .replace(/\/api$/i, "");
      const socketBase = apiBase || `${protocol}//${window.location.host}/api`;
      const socketUrl = socketBase
        .replace(/^http:/i, "ws:")
        .replace(/^https:/i, "wss:");
      socket = new WebSocket(
        `${socketUrl}/ws/chat?access_token=${encodeURIComponent(token)}`,
      );
      socketRef.current = socket;
      socket.onopen = () => {
        retryDelay = 1000;
        setConnected(true);
        window.dispatchEvent(
          new CustomEvent("aloogiyah:chat-socket", { detail: true }),
        );
        client.invalidateQueries({ queryKey: ["platform", "messages"] });
        client.invalidateQueries({ queryKey: ["platform", "chat-rooms"] });
        client.invalidateQueries({ queryKey: ["platform", "conversation"] });
        subscribedRooms.current.forEach((conversationCode) =>
          socket?.send(
            JSON.stringify({ type: "presence.subscribe", conversationCode }),
          ),
        );
        heartbeat = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, 25000);
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            data?:
              | Message
              | {
                  conversationCode: string;
                  userCode: string;
                  isOnline: boolean;
                };
          };
          if (
            payload.type === "presence.changed" &&
            payload.data &&
            "isOnline" in payload.data
          ) {
            window.dispatchEvent(
              new CustomEvent("aloogiyah:chat-presence", {
                detail: payload.data,
              }),
            );
            return;
          }
          if (payload.type === "conversation.created") {
            client.invalidateQueries({ queryKey: ["platform", "chat-rooms"] });
            return;
          }
          if (payload.type !== "message.received" || !payload.data) return;
          const message = payload.data as Message;
          window.dispatchEvent(
            new CustomEvent<Message>("aloogiyah:chat-message", {
              detail: message,
            }),
          );
          client.invalidateQueries({ queryKey: ["platform", "chat-rooms"] });
          if (message.isDeleted || message.isRead)
            toast.dismiss(
              `chat-${message.conversationCode || message.senderCode}`,
            );
          else void showNotification(message);
        } catch {
          // History stays available through the chat API if a malformed event arrives.
        }
      };
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (heartbeat) clearInterval(heartbeat);
        setConnected(false);
        window.dispatchEvent(
          new CustomEvent("aloogiyah:chat-socket", { detail: false }),
        );
        if (disposed) return;
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (heartbeat) clearInterval(heartbeat);
      socket?.close();
      if (socketRef.current === socket) socketRef.current = null;
      setConnected(false);
      window.dispatchEvent(
        new CustomEvent("aloogiyah:chat-socket", { detail: false }),
      );
    };
  }, [client, me, router]);

  return (
    <div
      className={className}
      data-chat-realtime={connected ? "connected" : "connecting"}
    >
      {children}
    </div>
  );
}
