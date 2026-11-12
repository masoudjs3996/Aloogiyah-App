import { SellerDiscountForm } from "../design-system/organisms/SellerDiscountForm";
import { useRoles } from "../shared/hooks/useRoles";
import { useAction } from "../shared/hooks/useAction";
import { useChatUploadQueue, type ChatUpload } from "../shared/hooks/useChatUploadQueue";
import { cacheSentMedia } from "../shared/utils/chat-media-cache";
import ChatUploadBubble from "../design-system/organisms/ChatUploadBubble";
import { appAlert } from "../shared/alerts";
import { usePollingInterval } from "../shared/hooks/usePollingInterval";
import MessageActions from "../design-system/organisms/MessageActions";
import { MessageSelectionBar } from "../design-system/organisms/MessageSelectionBar";
import { toggleMessageSelection } from "../shared/utils/message-selection";
import {
  ChatFileUpload,
  ChatFileDownload,
} from "../design-system/organisms/ChatFiles";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { QueryState } from "../design-system/molecules/QueryState";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { useAuth, useProfile } from "../shared/providers/AuthProvider";
import { useChatSocket } from "../shared/hooks/useChatSocket";
import { chatTime, mergeChatMessage } from "../shared/utils/chat";
import { date } from "../shared/utils/format";
import { theme } from "../shared/theme";
import type { Message } from "../shared/types/platform";
import { chatAttachmentRows } from "../shared/utils/chat-attachment-rows";
import type { Props } from "../navigation/types";

type PendingMessage = Message & { localState: "pending" | "failed" };
type DisplayMessage = Message & { localState?: "pending" | "failed" };

function MessageBubble({
  item,
  own,
  retry,
  selectionMode,
  selected,
  onSelect,
  grouped = false,
}: {
  item: DisplayMessage;
  own: boolean;
  grouped?: boolean;
  retry: () => void;
  selectionMode: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const held = useRef(false);
  const hasAttachment = !!item.attachmentName;
  const Bubble = hasAttachment ? View : Pressable;
  const Body = hasAttachment ? Pressable : View;
  const photo =
    !!item.attachmentName && item.attachmentType?.startsWith("image/");
  const media = photo || (hasAttachment && item.attachmentType?.startsWith("video/"));
  const openAttachmentActions = () => selectionMode ? onSelect() : setActionsOpen(true);
  const status =
    item.localState === "pending"
      ? "در انتظار ارسال"
      : item.isRead
        ? "خوانده شده"
        : "ارسال شده";
  return (
    <View
      style={{
        flexDirection: own ? "row-reverse" : "row",
        alignItems: "center",
        gap: 8,
        marginVertical: grouped ? 0 : 6,
      }}
    >
      {selectionMode && !item.localState && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="انتخاب پیام"
          accessibilityState={{ checked: selected }}
          onPress={onSelect}
          style={{ padding: 4 }}
        >
          <Ionicons
            name={selected ? "checkmark-circle" : "ellipse-outline"}
            color={selected ? theme.green : "#94A3B8"}
            size={25}
          />
        </Pressable>
      )}
      <Bubble
        {...(!hasAttachment && {
          accessibilityRole: "button" as const,
          accessibilityLabel: item.message,
          accessibilityHint: "لمس برای گزینه‌ها؛ نگه‌داشتن برای انتخاب پیام",
          accessibilityState: { selected },
          onPressIn: () => {
          held.current = false;
          },
          onPress: () => {
          if (item.localState || held.current) return;
          if (selectionMode) onSelect();
          else setActionsOpen(true);
          },
          onLongPress: () => {
          if (!item.localState) {
            held.current = true;
            setActionsOpen(false);
            onSelect();
          }
          },
          accessibilityActions: [{ name: "longpress", label: "انتخاب پیام" }],
          onAccessibilityAction: () => { if (!item.localState) onSelect(); },
        })}
        style={[
          styles.bubble,
          grouped && { maxWidth: "100%", flexShrink: 1 },
          own ? styles.own : styles.received,
          photo && styles.photoBubble,
          selected && { borderWidth: 2, borderColor: theme.green },
        ]}
      >
        {hasAttachment && !item.localState && (
          <Pressable accessible={false} importantForAccessibility="no"
            style={StyleSheet.absoluteFill} onPress={openAttachmentActions} />
        )}
        {hasAttachment && (
          <View pointerEvents="box-none" style={{ position: "relative" }}>
            <ChatFileDownload item={item} own={own} />
            {media && !item.localState && !selectionMode && (
              <Pressable accessibilityRole="button" accessibilityLabel="گزینه‌های پیام پیوست"
                onPress={openAttachmentActions}
                style={{ position: "absolute", right: 4, top: 4, zIndex: 1, width: 44, height: 44,
                  borderRadius: 22, backgroundColor: "rgba(15,23,42,0.8)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="ellipsis-horizontal" size={22} color={theme.white} />
              </Pressable>
            )}
          </View>
        )}
        <Body {...(hasAttachment && {
          accessibilityRole: "button" as const,
          accessibilityLabel: "گزینه‌های پیام پیوست",
          onPress: openAttachmentActions,
          hitSlop: { bottom: 8, left: 8, right: 8, top: 0 },
        })}>
          {!grouped && !(item.attachmentName && item.message === "فایل پیوست") && (
            <Text
              style={{
                color: own ? "#022C22" : theme.ink,
                fontSize: 14,
                lineHeight: 27,
                writingDirection: "auto",
                marginHorizontal: photo ? 4 : 0,
              }}
            >
              {item.message}
            </Text>
          )}
          {item.isEdited && (
            <Text muted style={{ fontSize: 10 }}>
              ویرایش‌شده
            </Text>
          )}
          <View
            style={[
              styles.row,
              { marginTop: 8, flexWrap: "wrap", marginHorizontal: photo ? 4 : 0 },
            ]}
          >
            <Text
              style={{
                color: own ? "#047857" : "#94A3B8",
                fontSize: 9,
                lineHeight: 18,
              }}
            >
              {date(item.createdAt)} · {chatTime(item.createdAt)}
            </Text>
            {hasAttachment && !media && !item.localState && (
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Ionicons name="ellipsis-horizontal" size={18} color={theme.muted} />
              </View>
            )}
            {own &&
              (item.localState === "failed" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تلاش دوباره برای ارسال"
                  onPress={retry}
                  style={{ padding: 4 }}
                >
                  <Text
                    bold
                    style={{ color: "#92400E", fontSize: 10, lineHeight: 18 }}
                  >
                    تلاش دوباره
                  </Text>
                </Pressable>
              ) : (
                <View accessibilityLabel={status}>
                  <Ionicons
                    name={
                      item.localState === "pending"
                        ? "time-outline"
                        : item.isRead
                          ? "checkmark-done-outline"
                          : "checkmark-outline"
                    }
                    size={16}
                    color={item.isRead ? "#0369A1" : "#047857"}
                  />
                </View>
              ))}
          </View>
        </Body>
        {!item.localState && actionsOpen && (
          <MessageActions
            item={item}
            own={own}
            onSelect={onSelect}
            onClose={() => setActionsOpen(false)}
          />
        )}
      </Bubble>
    </View>
  );
}

export function ChatRoomScreen({ route, navigation }: Props<"ChatRoom">) {
  const requestedCode = route.params.code;
  const signedIn = useAuth().signedIn;
  const profile = useProfile();
  const me = profile.data?.user?.code || "";
  const focused = useIsFocused();
  const client = useQueryClient();
  const info = useQuery({
    queryKey: ["chat", "info", requestedCode],
    queryFn: ({ signal }) => platformApi.conversationInfo(requestedCode, signal),
    enabled: signedIn && focused,
    refetchInterval: usePollingInterval(15000),
  });
  const code = info.data?.code || requestedCode;
  const onFileSent = useCallback(async (message: Message, upload: ChatUpload) => {
    const type = message.attachmentType;
    if (type?.startsWith("image/") || type?.startsWith("video/"))
      await cacheSentMedia(message.code, type, upload.file.source).catch(() => undefined);
    mergeChatMessage(client, message);
    if (message.conversationCode !== upload.conversationCode)
      void client.invalidateQueries({ queryKey: ["chat", "info", requestedCode] });
    void client.invalidateQueries({ queryKey: ["chat", "rooms"] });
  }, [client, requestedCode]);
  const { uploads, enqueue, retry: retryUpload, cancel: cancelUpload } = useChatUploadQueue(onFileSent);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  useEffect(() => setSelectedCodes([]), [code]);
  const blocked = info.data?.isBlocked === true;
  const blockedByMe = info.data?.blockedByMe === true;
  const { busy: changingBlock, run: runBlock } = useAction();
  const { connected, peerOnline } = useChatSocket(blocked ? undefined : code);
  const q = useInfiniteQuery({
    queryKey: ["chat", "room", code],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      platformApi.conversation(code, pageParam, signal),
    enabled: signedIn && focused,
    getNextPageParam: (last) =>
      last.pageNumber * last.pageSize < last.totalCount
        ? last.pageNumber + 1
        : undefined,
    refetchInterval: usePollingInterval(15000),
  });
  const [discountOpen, setDiscountOpen] = useState(false);
  const { roles } = useRoles();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [inputHeight, setInputHeight] = useState(44);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const sending = useRef(new Set<string>());
  const markedRead = useRef(new Set<string>());
  const sequence = useRef(0);
  const list = useRef<FlatList<(typeof displayRows)[number]>>(null);
  const nearBottom = useRef(true);
  const lastMessage = useRef("");
  const wasConnected = useRef(false);
  const text = drafts[requestedCode] || "";
  const peerName = info.data?.peerName || route.params.title || "کاربر";
  const context = [info.data?.farmName, info.data?.productName]
    .filter(Boolean)
    .join(" · ");
  const presence = connected
    ? (peerOnline ?? info.data?.peerOnline ?? null)
    : null;
  const messages = useMemo(
    () => [
      ...new Map(
        q.data?.pages
          .flatMap((page) => page.items)
          .map((item) => [item.code, item]) || [],
      ).values(),
    ],
    [q.data],
  );
  const display = useMemo<(DisplayMessage | ChatUpload)[]>(
    () =>
      [
        ...messages,
        ...pending.filter(
          (item) =>
            item.conversationCode === code ||
            item.conversationCode === requestedCode,
        ),
        ...uploads.filter(item => item.receiverCode === info.data?.peerCode),
      ].sort(
        (a, b) =>
          Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
          b.code.localeCompare(a.code),
      ),
    [messages, pending, uploads, code, requestedCode, info.data?.peerCode],
  );
  const displayRows = useMemo(() => chatAttachmentRows([...display].reverse(), me).reverse(), [display, me]);
  const selectedMessages = display.filter(
    (item): item is DisplayMessage => !("file" in item) && !item.localState && selectedCodes.includes(item.code),
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
  const deliver = useCallback(
    async (item: PendingMessage) => {
      if (sending.current.has(item.code)) return;
      sending.current.add(item.code);
      setPending((current) =>
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
        mergeChatMessage(client, saved);
        if (saved.conversationCode !== requestedCode) {
          void client.invalidateQueries({
            queryKey: ["chat", "info", requestedCode],
          });
        }
        setPending((current) =>
          current.filter((message) => message.code !== item.code),
        );
        void client.invalidateQueries({ queryKey: ["chat", "rooms"] });
      } catch {
        setPending((current) =>
          current.map((message) =>
            message.code === item.code
              ? { ...message, localState: "failed" }
              : message,
          ),
        );
      } finally {
        sending.current.delete(item.code);
      }
    },
    [client, requestedCode],
  );
  useEffect(() => {
    if (connected && !wasConnected.current)
      pending
        .filter((item) => item.localState === "failed")
        .forEach((item) => void deliver(item));
    wasConnected.current = connected;
  }, [connected, pending, deliver]);
  useEffect(() => {
    if (!me || !focused) return;
    messages
      .filter(
        (item) =>
          item.receiverCode === me &&
          !item.isRead &&
          !markedRead.current.has(item.code),
      )
      .forEach((item) => {
        markedRead.current.add(item.code);
        void platformApi
          .markMessageRead(item)
          .then(() => {
            mergeChatMessage(client, { ...item, isRead: true });
            void client.invalidateQueries({ queryKey: ["chat", "rooms"] });
          })
          .catch(() => markedRead.current.delete(item.code));
      });
  }, [messages, me, focused, client]);
  useEffect(() => {
    const latest = display[0]?.code || "";
    if (latest !== lastMessage.current && nearBottom.current)
      requestAnimationFrame(() =>
        list.current?.scrollToOffset({
          offset: 0,
          animated: !!lastMessage.current,
        }),
      );
    lastMessage.current = latest;
  }, [display]);
  const submit = () => {
    const body = text.trim();
    if (
      blocked || changingBlock || !body ||
      body.length > 4000 ||
      !me ||
      !info.data?.peerCode ||
      info.data.peerCode === me
    )
      return;
    const item: PendingMessage = {
      code: "pending-" + Date.now() + "-" + ++sequence.current,
      conversationCode: code,
      message: body,
      senderCode: me,
      receiverCode: info.data.peerCode,
      senderName: profile.data?.user?.fName || "",
      receiverName: peerName,
      isRead: false,
      createdAt: new Date().toISOString(),
      localState: "pending",
    };
    setPending((current) => [...current, item]);
    setDrafts((current) => ({ ...current, [requestedCode]: "" }));
    setInputHeight(44);
    nearBottom.current = true;
    void deliver(item);
  };
  const confirmBlock = () => {
    const next = !blockedByMe;
    const title = next ? "مسدود کردن کاربر" : "رفع مسدودی کاربر";
    appAlert.alert(title, next
      ? "پس از مسدود کردن، ارسال پیام و فایل در این گفت‌وگو متوقف می‌شود. می‌توانید بعداً مسدودی را بردارید."
      : "مسدودی‌ای که شما اعمال کرده‌اید برداشته می‌شود.", [
      { text: "انصراف", style: "cancel" },
      { text: title, style: next ? "destructive" : "default", onPress: () => void runBlock(async () => {
        await platformApi.setConversationBlocked(code, next);
        await info.refetch();
      }) },
    ]);
  };
  return (
    <AuthGate>
      <SafeAreaView
        edges={["top"]}
        style={{ flex: 1, backgroundColor: "white" }}
      >
        <Screen scroll={false}>
          {discountOpen && info.data?.peerCode && (
            <SellerDiscountForm
              customerCode={info.data.peerCode}
              customerName={peerName}
              onClose={() => setDiscountOpen(false)}
              onPrepare={(text) =>
                setDrafts((current) => ({ ...current, [requestedCode]: text }))
              }
            />
          )}
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="بازگشت به مکالمه‌ها"
              onPress={() => navigation.popTo("Chat")}
              style={styles.back}
            >
              <Ionicons name="arrow-forward" size={22} color={theme.green} />
            </Pressable>
            {!!me && !!info.data?.peerCode && (
              <Pressable accessibilityRole="button" accessibilityLabel={blockedByMe ? "رفع مسدودی کاربر" : "مسدود کردن کاربر"}
                accessibilityState={{ disabled: changingBlock }} disabled={changingBlock} onPress={confirmBlock} style={styles.back}>
                <Ionicons name={blockedByMe ? "lock-closed-outline" : "ban-outline"} size={21} color={theme.danger} />
              </Pressable>
            )}
            {roles.some((role) => role === "Farmer") &&
              info.data?.peerCode &&
              info.data.peerCode !== me && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="ساخت کد تخفیف"
                  onPress={() => setDiscountOpen(true)}
                  style={{
                    padding: 10,
                    backgroundColor: theme.mint,
                    borderRadius: 12,
                  }}
                >
                  <Ionicons
                    name="ticket-outline"
                    size={22}
                    color={theme.green}
                  />
                  <Text style={{ fontSize: 10, color: theme.green }}>
                    ساخت تخفیف
                  </Text>
                </Pressable>
              )}
            <View style={styles.avatar}>
              <Ionicons
                name="chatbubbles-outline"
                size={22}
                color={theme.green}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text bold numberOfLines={1} style={{ fontSize: 14 }}>
                {"گفت‌وگو با " + peerName}
              </Text>
              {!blocked && <View style={styles.row}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: presence ? "#10B981" : "#CBD5E1",
                  }}
                />
                <Text muted style={{ fontSize: 10, lineHeight: 20 }}>
                  {presence === null
                    ? connected
                      ? "در حال بررسی وضعیت"
                      : "در حال اتصال"
                    : presence
                      ? "آنلاین"
                      : "آفلاین"}
                </Text>
              </View>}
              {!!context && (
                <Text
                  muted
                  numberOfLines={1}
                  style={{ fontSize: 10, lineHeight: 20 }}
                >
                  {context}
                </Text>
              )}
            </View>
          </View>
          <QueryState
            loading={info.isLoading}
            error={info.error}
            retry={() => info.refetch()}
          />
          <QueryState
            loading={q.isLoading}
            error={!q.data ? q.error : undefined}
            retry={() => q.refetch()}
          />
          {selectedMessages.length > 0 && (
            <MessageSelectionBar
              messages={selectedMessages}
              me={me}
              onClose={() => setSelectedCodes([])}
            />
          )}
          <FlatList
            key={code}
            accessibilityLabel="پیام‌های مکالمه"
            ref={list}
            inverted
            data={displayRows}
            keyExtractor={(item) => item.code}
            style={{ flex: 1, backgroundColor: "#F8FAFC" }}
            contentContainerStyle={{ padding: 12, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onContentSizeChange={() => {
              if (nearBottom.current)
                list.current?.scrollToOffset({ offset: 0, animated: false });
            }}
            onScroll={(event) => {
              nearBottom.current = event.nativeEvent.contentOffset.y < 160;
            }}
            scrollEventThrottle={100}
            ListEmptyComponent={
              !q.isLoading && !q.error ? (
                <View style={{ paddingVertical: 40 }}>
                  <Text muted style={{ textAlign: "center", fontSize: 12 }}>
                    {blocked ? "پیامی در این گفت‌وگو وجود ندارد." : "اولین پیام را بنویسید."}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item: row }) => {
              const renderMessage = (item: DisplayMessage | ChatUpload) => "file" in item ? (
                  <ChatUploadBubble key={item.code} item={item} grouped={row.grouped} onCancel={() => cancelUpload(item.code)}
                    onRetry={() => { if (!blocked && !changingBlock) retryUpload(item.code); }} />
                ) : (
                  <MessageBubble
                    key={item.code}
                    item={row.grouped && row.caption ? { ...item, message: row.caption } : item}
                    grouped={row.grouped}
                    own={item.senderCode === me}
                    selectionMode={selectedMessages.length > 0}
                    selected={selectedCodes.includes(item.code)}
                    onSelect={() => toggleSelection(item.code)}
                    retry={() => {
                      if (!blocked && !changingBlock && "localState" in item)
                        void deliver(item as PendingMessage);
                    }}
                  />
              );
              if (!row.grouped) return renderMessage(row.items[0]);
              const own = !("senderCode" in row.items[0]) || row.items[0].senderCode === me;
              const gallery = row.items.length > 1 && row.items.every(item =>
                !("file" in item) && /^(image|video)\//.test(item.attachmentType ?? ""));
              return (
                <View style={{ width: 300, maxWidth: "90%", alignSelf: own ? "flex-end" : "flex-start",
                  borderRadius: 16, padding: 4, marginVertical: 6, backgroundColor: own ? theme.mint : theme.white }}>
                  <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 4 }}>
                    {row.items.map(item => (
                      <View key={item.code} style={{ width: gallery ? "49%" : "100%" }}>
                        {renderMessage(item)}
                      </View>
                    ))}
                  </View>
                  {!!row.caption && <Text style={{ padding: 8, writingDirection: "auto" }}>{row.caption}</Text>}
                </View>
              );
            }}
            onEndReached={() => {
              if (q.hasNextPage && !q.isFetching && !q.isFetchNextPageError)
                void q.fetchNextPage();
            }}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              <View>
                {q.isFetchingNextPage && (
                  <ActivityIndicator
                    color={theme.green}
                    accessibilityLabel="دریافت پیام‌های قبلی"
                  />
                )}
                <View>
                  <QueryState
                    error={q.isFetchNextPageError ? q.error : undefined}
                    retry={() => q.fetchNextPage()}
                  />
                </View>
              </View>
            }
          />
          {blocked ? (
            <View style={styles.composer}>
              <Text muted>{blockedByMe ? "کاربر مسدود است. برای رفع مسدودی از دکمهٔ قفل بالای گفت‌وگو استفاده کنید." : "ارسال پیام در این گفت‌وگو امکان‌پذیر نیست."}</Text>
            </View>
          ) : <View style={styles.composer}>
            <View style={styles.inputCard}>
              <ChatFileUpload
                code={code}
                receiverCode={info.data?.peerCode || ""}
                disabled={
                  changingBlock || !me || !info.data?.peerCode || info.data.peerCode === me
                }
                onQueue={(files, room, receiver, caption) => {
                  nearBottom.current = true;
                  enqueue(files, room, receiver, caption);
                }}
              />
              <TextInput
                accessibilityLabel="متن پیام"
                placeholder="پیام خود را بنویسید…"
                placeholderTextColor="#94A3B8"
                multiline
                maxLength={4000}
                value={text}
                onChangeText={(value) =>
                  setDrafts((current) => ({ ...current, [requestedCode]: value }))
                }
                editable={!changingBlock && !!info.data?.peerCode && info.data.peerCode !== me}
                scrollEnabled={inputHeight >= 112}
                onContentSizeChange={(event) =>
                  setInputHeight(
                    Math.max(
                      44,
                      Math.min(112, event.nativeEvent.contentSize.height),
                    ),
                  )
                }
                style={[styles.input, { height: inputHeight }]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ارسال پیام"
              disabled={
                changingBlock || !text.trim() ||
                !me ||
                !info.data?.peerCode ||
                info.data.peerCode === me
              }
              onPress={submit}
              style={({ pressed }) => [
                styles.send,
                (!text.trim() || !me || !info.data?.peerCode) && {
                  opacity: 0.45,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name="send-outline"
                size={21}
                color="white"
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </Pressable>
          </View>}
        </Screen>
      </SafeAreaView>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  own: { backgroundColor: "#D1FAE5", borderTopRightRadius: 4 },
  photoBubble: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 8 },
  received: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderTopLeftRadius: 4,
  },
  composer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 12,
    gap: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  inputCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    maxHeight: 112,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontFamily: "Vazir",
    fontSize: 13,
    lineHeight: 24,
    color: theme.ink,
    textAlign: "right",
    textAlignVertical: "top",
    backgroundColor: "white",
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
  },
});
