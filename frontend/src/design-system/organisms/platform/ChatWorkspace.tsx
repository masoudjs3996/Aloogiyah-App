"use client";
import ChatFileUpload from "@/design-system/molecules/platform/ChatFileUpload";
import ChatUploadBubble from "@/design-system/molecules/platform/ChatUploadBubble";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import { errorMessage, platformApi } from "@/lib/actions/platform";
import type { Message } from "@/shared/types/platform";
import { chatAttachmentRows } from "@/shared/utils/chat-attachment-rows";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import QueryState from "@/design-system/molecules/platform/QueryState";
import MessageBubble from "@/design-system/molecules/platform/MessageBubble";
import MessageSelectionBar from "@/design-system/molecules/platform/MessageSelectionBar";
import { toggleMessageSelection } from "@/shared/utils/message-selection";
import SellerDiscountDialog from "./SellerDiscountDialog";
import { useSellerAccess } from "@/shared/hooks/useSellerAccess";
import { useChatUploadQueue, type ChatUpload } from "@/shared/hooks/useChatUploadQueue";
import { cacheSentMedia } from "@/shared/utils/chat-media-cache";

import type { Page } from "@/shared/types/platform";

type PendingMessage = Message & { localState: "pending" | "failed" };

function addMessageToConversation(
  client: ReturnType<typeof useQueryClient>,
  roomCode: string,
  message: Message,
) {
  const queryKey = ["platform", "conversation", roomCode];
  client.setQueryData<InfiniteData<Page<Message>>>(queryKey, (old) => {
    const current = old ?? {
      pageParams: [1],
      pages: [{ items: [], totalCount: 0, pageNumber: 1, pageSize: 30 }],
    };
    if (message.isDeleted)
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.code !== message.code),
        })),
      };
    if (
      current.pages.some((page) =>
        page.items.some((item) => item.code === message.code),
      )
    ) {
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.code === message.code ? { ...item, ...message } : item,
          ),
        })),
      };
    }
    const [first, ...rest] = current.pages;
    return {
      ...current,
      pages: [
        {
          ...first,
          items: [message, ...first.items],
          totalCount: first.totalCount + 1,
        },
        ...rest,
      ],
    };
  });
}

export default function ChatWorkspace({
  initialReceiver = "",
  initialRoomCode = "",
  initialReceiverName = "",
  initialContextName = "",
  initialContextType = "",
}: {
  initialReceiver?: string;
  initialRoomCode?: string;
  initialReceiverName?: string;
  initialContextName?: string;
  initialContextType?: string;
}) {
  const profile = usePlatformProfile();
  const sellerAccess = useSellerAccess();
  const [discountPeer, setDiscountPeer] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const me = profile.data?.user?.code || "";
  const client = useQueryClient();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  useEffect(() => setSelectedCodes([]), [roomCode]);
  const [roomError, setRoomError] = useState("");
  const [roomRetry, setRoomRetry] = useState(0);
  const [peerOnline, setPeerOnline] = useState<boolean | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [receiver, setReceiver] = useState(initialReceiver);
  const [receiverName, setReceiverName] = useState(initialReceiverName);
  const [contextName, setContextName] = useState(initialContextName);
  const [contextType, setContextType] = useState(initialContextType);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const onFileSent = useCallback(async (message: Message, upload: ChatUpload) => {
    const type = message.attachmentType;
    if (type?.startsWith("image/") || type?.startsWith("video/"))
      await cacheSentMedia(message.code, type, upload.file).catch(() => undefined);
    addMessageToConversation(client, message.conversationCode, message);
    if (message.conversationCode !== upload.conversationCode) {
      void client.invalidateQueries({
        queryKey: ["platform", "conversation-info", upload.conversationCode],
      });
    }
    void client.invalidateQueries({ queryKey: ["platform", "chat-rooms", me] });
  }, [client, me]);
  const { uploads, enqueue, retry: retryUpload, cancel: cancelUpload } = useChatUploadQueue(onFileSent);
  const sendingPending = useRef(new Set<string>());
  const scroll = useRef<HTMLDivElement>(null);
  const messageContent = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const measuredScrollHeight = useRef(0);
  const composer = useRef<HTMLFormElement>(null);
  const [keyboardViewport, setKeyboardViewport] = useState<{
    top: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!roomCode || !viewport) {
      setKeyboardViewport(null);
      return;
    }
    let fullHeight = Math.max(window.innerHeight, viewport.height);
    let width = window.innerWidth;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const editing = !!composer.current?.contains(document.activeElement);
        if (width !== window.innerWidth) {
          width = window.innerWidth;
          fullHeight = Math.max(window.innerHeight, viewport.height);
        }
        if (!editing)
          fullHeight = Math.max(window.innerHeight, viewport.height);
        else
          fullHeight = Math.max(
            fullHeight,
            window.innerHeight,
            viewport.height,
          );
        const open =
          editing &&
          width < 768 &&
          viewport.scale === 1 &&
          fullHeight - viewport.height > 120;
        setKeyboardViewport((previous) => {
          if (!open) return null;
          if (
            previous?.top === viewport.offsetTop &&
            previous.height === viewport.height
          )
            return previous;
          return { top: viewport.offsetTop, height: viewport.height };
        });
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, [roomCode]);
  const priorLatest = useRef("");
  const lastScrolledRoom = useRef("");
  const loadingOlder = useRef(false);
  const markedRead = useRef(new Set<string>());
  useEffect(() => {
    setReceiver(initialReceiver);
    setReceiverName(initialReceiverName);
    setContextName(initialContextName);
    setContextType(initialContextType);
  }, [
    initialReceiver,
    initialReceiverName,
    initialContextName,
    initialContextType,
  ]);
  useEffect(() => setRoomCode(initialRoomCode), [initialRoomCode]);
  const roomInfo = useQuery({
    queryKey: ["platform", "conversation-info", roomCode],
    queryFn: ({ signal }) => platformApi.conversationInfo(roomCode, signal),
    enabled: !!me && !!roomCode,
  });
  useEffect(() => {
    if (!roomInfo.data) return;
    setReceiver(roomInfo.data.peerCode);
    setReceiverName(roomInfo.data.peerName);
    if (typeof roomInfo.data.peerOnline === "boolean")
      setPeerOnline(roomInfo.data.peerOnline);
    setContextName(
      (current) =>
        current || roomInfo.data.farmName || roomInfo.data.productName || "",
    );
    setContextType(
      (current) =>
        current ||
        (roomInfo.data.farmName
          ? "گلخانه"
          : roomInfo.data.productName
            ? "محصول"
            : ""),
    );
  }, [roomInfo.data]);
  useEffect(() => {
    if (!me || !receiver || roomCode || receiver === me) return;
    let cancelled = false;
    setRoomError("");
    void platformApi
      .getOrCreateConversation(receiver)
      .then((room) => {
        if (cancelled) return;
        setRoomCode(room.code);
        setReceiver(room.peerCode);
        const params = new URLSearchParams({ room: room.code });
        router.replace(`/dashboard/chat?${params.toString()}`, {
          scroll: false,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) setRoomError(errorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [me, receiver, roomCode, roomRetry, router]);
  const receiverContact = useQuery({
    queryKey: ["platform", "chat-contact", receiver],
    queryFn: ({ signal }) => platformApi.chatContact(receiver, signal),
    enabled: !!me && !!receiver && receiver !== me && !receiverName,
  });
  useEffect(() => {
    if (!receiverContact.data) return;
    setReceiverName(receiverContact.data.displayName);
    if (!contextName) {
      setContextName(
        receiverContact.data.farmName || receiverContact.data.productName || "",
      );
      setContextType(
        receiverContact.data.farmName
          ? "گلخانه"
          : receiverContact.data.productName
            ? "محصول"
            : "",
      );
    }
  }, [receiverContact.data, contextName]);
  const chatRooms = useQuery({
    queryKey: ["platform", "chat-rooms", me],
    queryFn: ({ signal }) => platformApi.chatRooms(signal),
    enabled: !!me,
  });
  useEffect(() => {
    const savedRoom = roomInfo.data;
    if (
      !roomCode.startsWith("draft-") ||
      !savedRoom ||
      savedRoom.code === roomCode
    )
      return;

    setRoomCode(savedRoom.code);
    const params = new URLSearchParams({ room: savedRoom.code });
    if (contextName) params.set("contextName", contextName);
    if (contextType) params.set("contextType", contextType);
    router.replace(`/dashboard/chat?${params.toString()}`, { scroll: false });
  }, [roomCode, roomInfo.data, contextName, contextType, router]);

  const conversation = useInfiniteQuery({
    queryKey: ["platform", "conversation", roomCode],
    initialPageParam: 1,
    enabled: !!me && !!roomCode && !!receiver && me !== receiver,
    queryFn: ({ pageParam, signal }) =>
      platformApi.conversation(roomCode, pageParam, signal),
    getNextPageParam: (last) =>
      last.pageNumber * last.pageSize < last.totalCount
        ? last.pageNumber + 1
        : undefined,
  });

  const deliverPendingMessage = useCallback(
    async (item: PendingMessage) => {
      if (sendingPending.current.has(item.code)) return;
      if (!navigator.onLine) {
        setPendingMessages((current) =>
          current.map((message) =>
            message.code === item.code
              ? { ...message, localState: "failed" }
              : message,
          ),
        );
        return;
      }

      sendingPending.current.add(item.code);
      setPendingMessages((current) =>
        current.map((message) =>
          message.code === item.code
            ? { ...message, localState: "pending" }
            : message,
        ),
      );
      try {
        const saved = await platformApi.sendMessage({
          conversationCode: item.conversationCode,
          message: item.message,
        });
        addMessageToConversation(client, saved.conversationCode, saved);
        if (saved.conversationCode !== item.conversationCode) {
          void client.invalidateQueries({
            queryKey: ["platform", "conversation-info", item.conversationCode],
          });
        }
        setPendingMessages((current) =>
          current.filter((message) => message.code !== item.code),
        );
        client.invalidateQueries({ queryKey: ["platform", "chat-rooms", me] });
      } catch {
        setPendingMessages((current) =>
          current.map((message) =>
            message.code === item.code
              ? { ...message, localState: "failed" }
              : message,
          ),
        );
      } finally {
        sendingPending.current.delete(item.code);
      }
    },
    [client, me],
  );

  useEffect(() => {
    const retryQueued = () => {
      if (!navigator.onLine) return;
      pendingMessages
        .filter((message) => message.localState === "failed")
        .forEach((message) => void deliverPendingMessage(message));
    };
    const handleSocket = (event: Event) => {
      if ((event as CustomEvent<boolean>).detail) retryQueued();
    };
    window.addEventListener("online", retryQueued);
    window.addEventListener("aloogiyah:chat-socket", handleSocket);
    return () => {
      window.removeEventListener("online", retryQueued);
      window.removeEventListener("aloogiyah:chat-socket", handleSocket);
    };
  }, [pendingMessages, deliverPendingMessage]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("aloogiyah:chat-active", { detail: roomCode }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("aloogiyah:chat-active", { detail: "" }),
      );
    };
  }, [roomCode]);
  useEffect(() => {
    setPeerOnline(null);
    if (!roomCode) return;
    const timer = window.setTimeout(
      () =>
        window.dispatchEvent(
          new CustomEvent("aloogiyah:chat-room-presence", {
            detail: { action: "subscribe", conversationCode: roomCode },
          }),
        ),
      0,
    );
    return () => {
      window.clearTimeout(timer);
      window.dispatchEvent(
        new CustomEvent("aloogiyah:chat-room-presence", {
          detail: { action: "unsubscribe", conversationCode: roomCode },
        }),
      );
    };
  }, [roomCode]);
  useEffect(() => {
    const updatePresence = (event: Event) => {
      const presence = (
        event as CustomEvent<{
          conversationCode: string;
          userCode: string;
          isOnline: boolean;
        }>
      ).detail;
      if (presence?.conversationCode === roomCode)
        setPeerOnline(presence.isOnline);
    };
    window.addEventListener("aloogiyah:chat-presence", updatePresence);
    return () =>
      window.removeEventListener("aloogiyah:chat-presence", updatePresence);
  }, [roomCode]);
  useEffect(() => {
    const updateConnection = (event: Event) => {
      const connected = (event as CustomEvent<boolean>).detail;
      setSocketConnected(connected);
      if (!connected) setPeerOnline(null);
    };
    window.addEventListener("aloogiyah:chat-socket", updateConnection);
    return () =>
      window.removeEventListener("aloogiyah:chat-socket", updateConnection);
  }, []);
  useEffect(() => {
    const handleMessage = (event: Event) => {
      const message = (event as CustomEvent<Message>).detail;
      if (!message) return;
      if (message.conversationCode === roomCode)
        addMessageToConversation(client, roomCode, message);
      if (
        roomCode === `draft-${message.senderCode}` ||
        roomCode === `draft-${message.receiverCode}`
      ) {
        void client.invalidateQueries({
          queryKey: ["platform", "conversation-info", roomCode],
        });
      }
      client.invalidateQueries({ queryKey: ["platform", "chat-rooms", me] });
    };
    window.addEventListener("aloogiyah:chat-message", handleMessage);
    return () =>
      window.removeEventListener("aloogiyah:chat-message", handleMessage);
  }, [client, me, roomCode]);
  const contacts = chatRooms.data || [];
  const messages = useMemo(() => {
    const map = new Map<string, Message>();
    conversation.data?.pages.forEach((p) =>
      p.items.forEach((m) => map.set(m.code, m)),
    );
    return [...map.values()].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        a.code.localeCompare(b.code),
    );
  }, [conversation.data]);
  const displayMessages = useMemo(
    () =>
      [
        ...messages,
        ...pendingMessages.filter(
          (message) => !!roomCode && message.receiverCode === receiver,
        ),
        ...uploads.filter(upload => !!roomCode && upload.receiverCode === receiver),
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages, pendingMessages, uploads, roomCode, receiver],
  );
  const displayRows = useMemo(() => chatAttachmentRows(displayMessages, me), [displayMessages, me]);
  const selectedMessages = displayMessages.filter(
    (item): item is Message => !("file" in item) && !("localState" in item) && selectedCodes.includes(item.code),
  );
  const toggleSelection = (code: string) =>
    setSelectedCodes((current) =>
      toggleMessageSelection(
        current.filter((selected) =>
          messages.some((item) => item.code === selected),
        ),
        code,
      ),
    );
  useEffect(() => {
    pinnedToBottom.current = true;
    const el = scroll.current;
    const content = messageContent.current;
    if (!el || !content) return;
    const observer = new ResizeObserver(() => {
      // Cached images can acquire their final height after the first scroll.
      if (pinnedToBottom.current && !loadingOlder.current)
        el.scrollTop = el.scrollHeight;
      measuredScrollHeight.current = el.scrollHeight;
    });
    observer.observe(content);
    observer.observe(el);
    return () => observer.disconnect();
  }, [roomCode, receiver, conversation.isSuccess]);
  useEffect(() => {
    if (!roomCode) {
      lastScrolledRoom.current = "";
      priorLatest.current = "";
      return;
    }
    const latest = displayMessages[displayMessages.length - 1]?.code || "";
    if (conversation.isSuccess && lastScrolledRoom.current !== roomCode) {
      lastScrolledRoom.current = roomCode;
      priorLatest.current = latest;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const el = scroll.current;
          if (el && lastScrolledRoom.current === roomCode)
            el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
        }),
      );
      return;
    }
    const atBottom = pinnedToBottom.current;
    if (priorLatest.current !== latest && atBottom && roomCode) {
      requestAnimationFrame(() => {
        const current = scroll.current;
        current?.scrollTo({ top: current.scrollHeight, behavior: "smooth" });
      });
    }
    priorLatest.current = latest;
  }, [conversation.isSuccess, displayMessages, roomCode]);
  useEffect(() => {
    if (!me || !receiver) return;
    const unread = messages.filter(
      (item) =>
        item.receiverCode === me &&
        !item.isRead &&
        !markedRead.current.has(item.code),
    );
    unread.forEach((item) => markedRead.current.add(item.code));
    if (!unread.length) return;
    void Promise.all(unread.map((item) => platformApi.markMessageRead(item)))
      .then(() => {
        client.invalidateQueries({
          queryKey: ["platform", "conversation", roomCode],
        });
        client.invalidateQueries({ queryKey: ["platform", "messages"] });
      })
      .catch(() =>
        unread.forEach((item) => markedRead.current.delete(item.code)),
      );
  }, [client, me, messages, receiver, roomCode]);
  async function loadOlder() {
    if (
      !conversation.hasNextPage ||
      conversation.isFetchingNextPage ||
      loadingOlder.current
    )
      return;
    const el = scroll.current;
    if (!el) return;
    loadingOlder.current = true;
    const height = el.scrollHeight;
    const top = el.scrollTop;
    try {
      await conversation.fetchNextPage();
      requestAnimationFrame(() => {
        if (scroll.current === el)
          el.scrollTop = top + el.scrollHeight - height;
        loadingOlder.current = false;
      });
    } catch {
      loadingOlder.current = false;
    }
  }
  const text = drafts[receiver] || "";
  return (
    <div className="mx-auto h-full min-h-0 max-w-6xl">
      <QueryState
        loading={!mounted || profile.isLoading}
        error={profile.error}
        retry={() => profile.refetch()}
        skeleton="chat"
      >
        <div
          data-chat-keyboard-open={keyboardViewport ? "true" : "false"}
          style={
            keyboardViewport
              ? {
                  position: "fixed",
                  top: keyboardViewport.top,
                  left: 0,
                  right: 0,
                  height: keyboardViewport.height,
                  minHeight: 0,
                  borderRadius: 0,
                  zIndex: 60,
                }
              : undefined
          }
          className="grid h-full min-h-0 grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:grid-cols-[280px_minmax(0,1fr)]"
        >
          <aside
            className={`${receiver ? "hidden xl:flex" : "flex"} min-h-0 min-w-0 flex-col border-b border-slate-100 p-4 xl:border-b-0 xl:border-l`}
          >
            <h2 className="mb-4 text-sm font-bold text-slate-700">مکالمه‌ها</h2>
            <QueryState
              loading={chatRooms.isLoading}
              error={chatRooms.error}
              skeleton="rows"
              retry={() => chatRooms.refetch()}
            >
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {receiver && !contacts.some((c) => c.peerCode === receiver) && (
                  <button
                    className="w-full rounded-xl bg-emerald-50 p-3 text-right text-xs text-emerald-800"
                    onClick={() => {
                      setReceiver(receiver);
                      const selectedContact = contacts.find(
                        (contact) => contact.peerCode === receiver,
                      );
                      setReceiverName(
                        selectedContact?.peerName || receiverName || "کاربر",
                      );
                      setContextName(
                        selectedContact?.farmName ||
                          selectedContact?.productName ||
                          "",
                      );
                      setContextType(
                        selectedContact?.farmName
                          ? "گلخانه"
                          : selectedContact?.productName
                            ? "محصول"
                            : "",
                      );
                    }}
                  >
                    {receiverName || "مخاطب این مکالمه"}
                  </button>
                )}
                {contacts.map((contact) => (
                  <button
                    key={contact.code}
                    onClick={() => {
                      setReceiver(contact.peerCode);
                      setReceiverName(contact.peerName || "کاربر");
                      setContextName(
                        contact.farmName || contact.productName || "",
                      );
                      setContextType(
                        contact.farmName
                          ? "گلخانه"
                          : contact.productName
                            ? "محصول"
                            : "",
                      );
                      setRoomCode(contact.code);
                      router.replace(
                        `/dashboard/chat?room=${encodeURIComponent(contact.code)}`,
                        { scroll: false },
                      );
                    }}
                    className={`w-full rounded-xl p-3 text-right transition ${roomCode === contact.code ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-emerald-100 p-2">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 text-emerald-700" />
                      </div>
                      <span className="truncate text-xs font-bold text-slate-700">
                        {contact.peerName || "کاربر"}
                      </span>
                      {(contact.unreadCount || 0) > 0 && (
                        <span className="mr-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-700 px-1.5 text-[10px] font-bold text-white">
                          {(contact.unreadCount || 0) > 99
                            ? "۹۹+"
                            : (contact.unreadCount || 0).toLocaleString(
                                "fa-IR",
                              )}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 truncate text-xs text-slate-400">
                      {contact.farmName || contact.productName
                        ? `${contact.farmName || ""}${contact.farmName && contact.productName ? " · " : ""}${contact.productName || ""}`
                        : contact.lastMessage || "گفت‌وگو آمادهٔ پیام است"}
                    </p>
                  </button>
                ))}
                {!contacts.length && !receiver && (
                  <p className="text-xs leading-6 text-slate-400">
                    برای شروع، از صفحه محصول یا درخواست خدمات، گفت‌وگو را باز
                    کنید.
                  </p>
                )}
              </div>
            </QueryState>
          </aside>
          <section
            className={`${receiver ? "flex" : "hidden xl:flex"} h-full min-h-0 min-w-0 flex-col`}
          >
            {receiver && receiver !== me ? (
              <>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white p-3 sm:p-4">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-800">
                        گفت‌وگو با{" "}
                        {receiverName ||
                          contacts.find((c) => c.peerCode === receiver)
                            ?.peerName ||
                          "کاربر"}
                      </p>
                      {roomCode && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                          <i
                            className={`h-2 w-2 rounded-full ${peerOnline ? "bg-emerald-500" : "bg-slate-300"}`}
                          />
                          {peerOnline === null
                            ? socketConnected
                              ? "در حال بررسی وضعیت"
                              : "در حال اتصال"
                            : peerOnline
                              ? "آنلاین"
                              : "آفلاین"}
                        </span>
                      )}
                    </div>
                    {contextName && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {contextType || "مرتبط با"}: {contextName}
                      </p>
                    )}
                  </div>
                  {sellerAccess.allowed && roomCode && (
                    <button
                      type="button"
                      onClick={() =>
                        setDiscountPeer({
                          code: receiver,
                          name: receiverName || "مخاطب",
                        })
                      }
                      className="min-h-11 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"
                    >
                      ساخت کد تخفیف
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setReceiver("");
                      setRoomCode("");
                      setReceiverName("");
                      setContextName("");
                      setContextType("");
                      router.replace("/dashboard/chat", { scroll: false });
                    }}
                    className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 xl:hidden"
                  >
                    <span>بازگشت</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
                {selectedMessages.length > 0 && (
                  <MessageSelectionBar
                    messages={selectedMessages}
                    me={me}
                    onClose={() => setSelectedCodes([])}
                  />
                )}
                <div
                  ref={scroll}
                  onScroll={(event) => {
                    const el = event.currentTarget;
                    if (el.scrollHeight === measuredScrollHeight.current)
                      pinnedToBottom.current =
                        el.scrollHeight - el.scrollTop - el.clientHeight < 160;
                    if (event.currentTarget.scrollTop <= 32) void loadOlder();
                  }}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 p-3 sm:p-6"
                >
                  <div ref={messageContent} className="space-y-4">
                    {!roomCode && roomError && (
                      <div className="mx-auto max-w-md rounded-xl border border-rose-100 bg-rose-50 p-4 text-center text-sm text-rose-800">
                        <p>{roomError}</p>
                        <button
                          type="button"
                          className="mt-3 font-bold underline"
                          onClick={() => setRoomRetry((value) => value + 1)}
                        >
                          تلاش دوباره
                        </button>
                      </div>
                    )}
                    <QueryState
                      loading={conversation.isLoading}
                      error={conversation.error}
                      retry={() => conversation.refetch()}
                      skeleton="rows"
                    />
                      {conversation.isFetchingNextPage && (
                        <p className="py-2 text-center text-xs text-slate-400">
                          در حال دریافت پیام‌های قبلی…
                        </p>
                      )}
                      {displayRows.map(row => {
                        const renderMessage = (item: (typeof displayMessages)[number]) => "file" in item ? (
                            <ChatUploadBubble key={item.code} item={item} grouped={row.grouped}
                              onCancel={() => cancelUpload(item.code)}
                              onRetry={() => retryUpload(item.code)} />
                          ) : (
                            <MessageBubble
                              key={item.code}
                              item={row.grouped && row.caption ? { ...item, message: row.caption } : item}
                              grouped={row.grouped}
                              own={item.senderCode === me}
                              selectionMode={selectedMessages.length > 0}
                              selected={selectedCodes.includes(item.code)}
                              onSelect={() => toggleSelection(item.code)}
                              onRetry={
                                "localState" in item && item.localState === "failed"
                                  ? () =>
                                      void deliverPendingMessage(
                                        item as PendingMessage,
                                      )
                                  : undefined
                              }
                            />
                        );
                        if (!row.grouped) return renderMessage(row.items[0]);
                        const own = !("senderCode" in row.items[0]) || row.items[0].senderCode === me;
                        const gallery = row.items.length > 1 && row.items.every(item =>
                          !("file" in item) && /^(image|video)\//.test(item.attachmentType ?? ""));
                        return (
                          <div key={row.code} className={`flex ${own ? "justify-start" : "justify-end"}`}>
                            <div className={`w-80 max-w-[90%] rounded-2xl p-1 ${own ? "bg-emerald-100" : "border border-slate-100 bg-white"}`}>
                              <div className={`grid gap-1 ${gallery ? "grid-cols-2" : "grid-cols-1"}`}>
                                {row.items.map(renderMessage)}
                              </div>
                              {row.caption && <p dir="auto" className="whitespace-pre-wrap break-words px-3 py-2 text-sm text-slate-800">{row.caption}</p>}
                            </div>
                          </div>
                        );
                      })}
                      {conversation.isSuccess && !displayMessages.length && (
                        <p className="py-16 text-center text-sm text-slate-400">
                          اولین پیام را بنویسید.
                        </p>
                      )}
                  </div>
                </div>
                <form
                  ref={composer}
                  style={keyboardViewport ? { paddingBottom: 12 } : undefined}
                  className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white p-2 sm:p-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const body = text.trim();
                    if (!roomCode || !body || body.length > 4000) return;
                    const pending: PendingMessage = {
                      code: `pending-${crypto.randomUUID()}`,
                      conversationCode: roomCode,
                      message: body,
                      senderCode: me,
                      receiverCode: receiver,
                      senderName: profile.data?.user?.fName || "",
                      receiverName,
                      isRead: false,
                      createdAt: new Date().toISOString(),
                      localState: navigator.onLine ? "pending" : "failed",
                    };
                    setPendingMessages((current) => [...current, pending]);
                    setDrafts((current) => ({ ...current, [receiver]: "" }));
                    if (navigator.onLine) void deliverPendingMessage(pending);
                    requestAnimationFrame(() => {
                      const el = scroll.current;
                      el?.scrollTo({
                        top: el.scrollHeight,
                        behavior: "smooth",
                      });
                    });
                  }}
                >
                  <div
                    data-chat-input-card
                    className="flex min-w-0 flex-1 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-1 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500"
                  >
                    <ChatFileUpload
                      roomCode={roomCode}
                      receiverCode={receiver}
                      onQueue={(files, room, target, caption) => {
                        if (!me) return;
                        pinnedToBottom.current = true;
                        enqueue(files, room, target, caption);
                      }}
                    />
                    <textarea
                      aria-label="متن پیام"
                      placeholder="پیام خود را بنویسید…"
                      maxLength={4000}
                      rows={Math.min(5, text.split("\n").length)}
                      value={text}
                      disabled={!roomCode}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [receiver]: e.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          if (text.trim() && roomCode)
                            event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      className="block min-h-11 min-w-0 flex-1 resize-none border-0 bg-transparent px-2 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
                    />
                  </div>
                  <ActionButton
                    type="submit"
                    disabled={!roomCode || !text.trim()}
                    aria-label="ارسال پیام"
                  >
                    <PaperAirplaneIcon className="h-5 w-5 rotate-180" />
                  </ActionButton>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-emerald-200" />
                <p className="text-sm text-slate-500">
                  یک مکالمه را انتخاب کنید.
                </p>
              </div>
            )}
          </section>
        </div>
      </QueryState>
      {discountPeer && sellerAccess.allowed && (
        <SellerDiscountDialog
          key={discountPeer.code}
          customerCode={discountPeer.code}
          customerName={discountPeer.name}
          onClose={() => setDiscountPeer(null)}
          onPrepare={(message) =>
            setDrafts((current) => ({
              ...current,
              [discountPeer.code]: [current[discountPeer.code], message]
                .filter(Boolean)
                .join("\n\n"),
            }))
          }
        />
      )}
    </div>
  );
}
