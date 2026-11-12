import { AppModal as Modal } from "../molecules/AppModal";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { platformApi, errorMessage } from "../../api/platform";
import type { Message, ChatConversation } from "../../shared/types/platform";
import { Text } from "../atoms/Text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { appAlert } from "../../shared/alerts";
import { saveChatMediaToGallery } from "../../shared/utils/save-chat-media-to-gallery";

export default function MessageActions({
  item,
  own,
  onClose,
  onSelect,
}: {
  item: Message;
  own: boolean;
  onClose: () => void;
  onSelect: () => void;
}) {
  const client = useQueryClient();
  const [mode, setMode] = useState<"edit" | "forward" | "delete" | "report" | null>(null);
  const [text, setText] = useState(item.message);
  const [reason, setReason] = useState("");
  const [rooms, setRooms] = useState<ChatConversation[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const editable = own && !item.isRead;
  const canSaveToGallery = Platform.OS !== "web" && !!item.attachmentName &&
    (item.attachmentType?.startsWith("image/") || item.attachmentType?.startsWith("video/"));
  const button = (label: string, action: () => void, disabled = busy) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={action}
      style={{
        padding: 12,
        opacity: disabled ? 0.5 : 1,
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Ionicons
        name={
          label === "کپی"
            ? "copy-outline"
            : label.includes("گالری")
              ? "download-outline"
            : label === "بازارسال"
              ? "arrow-redo-outline"
              : label === "ویرایش" || label === "ذخیره ویرایش"
                ? "create-outline"
                : label.includes("حذف")
                  ? "trash-outline"
                  : label.includes("گزارش")
                    ? "flag-outline"
                    : label === "انتخاب پیام"
                    ? "checkbox-outline"
                    : label === "انصراف"
                      ? "close-outline"
                      : "person-outline"
        }
        size={20}
        color={label.includes("حذف") ? "#E11D48" : "#047857"}
      />
      <Text style={{ color: label.includes("حذف") ? "#E11D48" : "#334155" }}>
        {label}
      </Text>
    </Pressable>
  );
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await action();
      onClose();
      setMode(null);
      await client.invalidateQueries({ queryKey: ["chat"] });
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function destinations() {
    setBusy(true);
    setNotice("");
    try {
      setRooms(await platformApi.chatRooms());
      setMode("forward");
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function saveToGallery() {
    if (busy) return;
    setBusy(true);
    setSaving(true);
    setNotice("");
    try {
      await saveChatMediaToGallery(item);
      onClose();
      requestAnimationFrame(() =>
        appAlert.alert("فایل ذخیره شد", "فایل در گالری گوشی ذخیره شد.", undefined, { tone: "success" }),
      );
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setSaving(false);
      setBusy(false);
    }
  }
  return (
    <>
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) onClose();
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 24,
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              maxHeight: "85%",
              borderRadius: 16,
              padding: 16,
              backgroundColor: "white",
            }}
          >
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text bold>گزینه‌های پیام</Text>
              {!mode && (
                <>
                  {canSaveToGallery && button(saving ? "در حال ذخیره در گالری…" : "ذخیره در گالری", () => void saveToGallery())}
                  {button("انتخاب پیام", () => {
                    onSelect();
                    onClose();
                  })}
                  {button(
                    "کپی",
                    () =>
                      void run(() =>
                        Clipboard.setStringAsync(
                          item.attachmentName
                            ? [
                                item.message === "فایل پیوست"
                                  ? ""
                                  : item.message,
                                item.attachmentName,
                              ]
                                .filter(Boolean)
                                .join("\n")
                            : item.message,
                        ),
                      ),
                  )}
                  {button("بازارسال", () => void destinations())}
                  {!own && button("گزارش پیام", () => setMode("report"))}
                  {editable && (
                    <>
                      {button("ویرایش", () => {
                        setText(item.message);
                        setMode("edit");
                      })}
                      {button("حذف", () => setMode("delete"))}
                    </>
                  )}
                </>
              )}
              {mode === "report" && (
                <>
                  <Text muted>دلیل گزارش و متن این پیام برای بررسی در اختیار تیم پشتیبانی قرار می‌گیرد.</Text>
                  <TextInput accessibilityLabel="دلیل گزارش پیام" value={reason} onChangeText={setReason}
                    multiline maxLength={1000} editable={!busy} placeholder="دلیل گزارش را بنویسید"
                    style={{ padding: 12, minHeight: 82, textAlign: "right", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10 }} />
                  {button("ارسال گزارش", () => void run(async () => {
                    const result = await platformApi.reportChatMessage(item.code, reason.trim());
                    appAlert.alert("گزارش پیام", result.alreadyPending ? "گزارش قبلی شما در حال بررسی است." : "گزارش برای بررسی ثبت شد.", undefined, { tone: "success" });
                  }), busy || reason.trim().length < 5)}
                  {button("انصراف", () => setMode(null))}
                </>
              )}
              {mode === "edit" && editable && (
                <>
                  <TextInput
                    accessibilityLabel="ویرایش متن پیام"
                    value={text}
                    onChangeText={setText}
                    maxLength={4000}
                    multiline
                    style={{
                      borderWidth: 1,
                      borderColor: "#CBD5E1",
                      padding: 12,
                      marginTop: 12,
                      minHeight: 100,
                      textAlign: "right",
                    }}
                  />
                  {button(
                    "ذخیره ویرایش",
                    () =>
                      void run(() =>
                        platformApi.editMessage(item.code, text.trim()),
                      ),
                    busy || !text.trim(),
                  )}
                </>
              )}
              {mode === "delete" && editable && (
                <>
                  <Text>این پیام برای هر دو طرف حذف شود؟</Text>
                  {button(
                    "تأیید حذف پیام",
                    () => void run(() => platformApi.deleteMessage(item.code)),
                  )}
                </>
              )}
              {mode === "forward" && (
                <>
                  <Text>ارسال به مکالمه:</Text>
                  {rooms.length === 0 && (
                    <Text>ابتدا یک گفت‌وگو با مخاطب باز کنید.</Text>
                  )}
                  {rooms.map((room) =>
                    button(
                      room.peerName,
                      () =>
                        void run(() =>
                          platformApi.forwardMessage(item.code, room.code),
                        ),
                    ),
                  )}
                </>
              )}
              {!!notice && (
                <Text accessibilityRole="alert" style={{ color: "#92400E" }}>
                  {notice}
                </Text>
              )}
              {button("انصراف", onClose)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
