import { AppModal as Modal } from "../molecules/AppModal";
import React, { useState } from "react";
import { View, Pressable, } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Message, Page } from "../../shared/types/platform";
import { platformApi, errorMessage } from "../../api/platform";
import {
  canDeleteMessages,
  selectedMessagesText,
} from "../../shared/utils/message-selection";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { theme } from "../../shared/theme";

export function MessageSelectionBar({
  messages,
  me,
  onClose,
}: {
  messages: Message[];
  me: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const allowed = canDeleteMessages(messages, me);
  return (
    <View
      style={{
        padding: 12,
        backgroundColor: theme.mint,
        borderBottomWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View
        style={{
          flexDirection: "row-reverse",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text bold style={{ flex: 1, fontSize: 12 }}>
          {messages.length.toLocaleString("fa-IR")} پیام انتخاب‌شده
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="کپی پیام‌های انتخاب‌شده"
          disabled={busy}
          onPress={async () => {
            try {
              await Clipboard.setStringAsync(selectedMessagesText(messages));
              setNotice("پیام‌ها کپی شدند");
            } catch (error) {
              setNotice(errorMessage(error));
            }
          }}
          style={{ padding: 12 }}
        >
          <Ionicons name="copy-outline" size={21} color={theme.green} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="حذف پیام‌ها"
          disabled={!allowed || busy}
          onPress={() => {
            setNotice("");
            setConfirm(true);
          }}
          style={{ padding: 12, opacity: allowed ? 1 : 0.35 }}
        >
          <Ionicons name="trash-outline" size={21} color={theme.danger} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="لغو انتخاب پیام‌ها"
          disabled={busy}
          onPress={onClose}
          style={{ padding: 12 }}
        >
          <Ionicons name="close" size={23} color={theme.muted} />
        </Pressable>
      </View>
      {!allowed && (
        <Text muted style={{ fontSize: 10, lineHeight: 19 }}>
          حذف فقط برای پیام‌های ارسال‌شده توسط شما که هنوز خوانده نشده‌اند فعال
          است.
        </Text>
      )}
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: theme.green, fontSize: 11 }}
        >
          {notice}
        </Text>
      )}
      <Modal
        visible={confirm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setConfirm(false);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "#0F172A80",
            padding: 24,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              padding: 20,
              borderRadius: 20,
              backgroundColor: "white",
              gap: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="trash-outline" size={22} color={theme.danger} />
              <Text bold>حذف پیام‌های انتخاب‌شده</Text>
            </View>
            <Text>
              {messages.length.toLocaleString("fa-IR")} پیام برای هر دو طرف حذف
              شود؟
            </Text>
            <Button
              title="تأیید حذف"
              busy={busy}
              disabled={!allowed}
              style={{
                backgroundColor: theme.danger,
                borderColor: theme.danger,
              }}
              onPress={async () => {
                setBusy(true);
                setNotice("");
                try {
                  const codes = await platformApi.deleteMessages(
                    messages.map((item) => item.code),
                  );
                  const removed = new Set(codes);
                  client.setQueryData<InfiniteData<Page<Message>>>(
                    ["chat", "room", messages[0].conversationCode],
                    (old) =>
                      old
                        ? {
                            ...old,
                            pages: old.pages.map((page) => ({
                              ...page,
                              items: page.items.filter(
                                (item) => !removed.has(item.code),
                              ),
                            })),
                          }
                        : old,
                  );
                  setConfirm(false);
                  onClose();
                } catch (error) {
                  setNotice(errorMessage(error));
                  setConfirm(false);
                } finally {
                  setBusy(false);
                  void client.invalidateQueries({ queryKey: ["chat"] });
                }
              }}
            />
            <Button
              title="انصراف"
              outline
              disabled={busy}
              onPress={() => setConfirm(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
