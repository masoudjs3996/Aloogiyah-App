import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import { chatFileSize } from "../../shared/utils/chat-file-size";
import type { ChatUpload } from "../../shared/hooks/useChatUploadQueue";

const ticks = Array.from({ length: 40 }, (_, index) => index);

export default function ChatUploadBubble({ item, onCancel, onRetry, grouped = false }: {
  item: ChatUpload;
  grouped?: boolean;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const failed = item.state === "failed";
  const uploading = item.state === "uploading";
  const progress = item.progress;
  const status = failed ? "ارسال نشد" : !uploading ? "در صف ارسال"
    : progress === 100 ? "در حال ثبت فایل…" : progress === null ? "در حال آماده‌سازی…"
    : `در حال ارسال · ${progress.toLocaleString("fa-IR")}٪`;
  return (
    <View style={{ alignSelf: "flex-end", width: grouped ? "100%" : 290, maxWidth: grouped ? "100%" : "90%", marginVertical: grouped ? 0 : 6, padding: 12,
      borderRadius: 16, backgroundColor: theme.mint, flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={failed ? "تلاش دوباره برای ارسال فایل" : "لغو ارسال فایل"}
        onPress={failed ? onRetry : onCancel} style={{ width: 48, height: 48, borderRadius: 24,
          backgroundColor: theme.white, justifyContent: "center", alignItems: "center" }}>
        {uploading && (progress === null ? (
          <ActivityIndicator color={theme.green} size="large" style={{ position: "absolute" }} />
        ) : ticks.map(index => (
          <View key={index} pointerEvents="none" style={{ position: "absolute", width: 48, height: 48, transform: [{ rotate: `${index * 9}deg` }] }}>
            <View style={{ position: "absolute", top: 2, left: 23, width: 2, height: 4, borderRadius: 1,
              backgroundColor: index < Math.floor(Math.min(99, progress) * 0.4) ? theme.green : theme.border }} />
          </View>
        )))}
        <Ionicons name={failed ? "refresh-outline" : "close-outline"} color={theme.green} size={22} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text bold numberOfLines={1}>{item.file.name}</Text>
        <Text muted style={{ fontSize: 11 }}>{chatFileSize(item.file.size)}</Text>
        {!grouped && !!item.caption && <Text>{item.caption}</Text>}
        <Text accessibilityRole={uploading ? "progressbar" : undefined}
          accessibilityValue={uploading ? { min: 0, max: 100, now: progress === null ? undefined : Math.min(99, progress), text: status } : undefined}
          style={{ fontSize: 12, color: failed ? theme.danger : theme.green }}>{status}</Text>
        {failed && <>
          <Text style={{ fontSize: 12, color: theme.danger }}>{item.error}</Text>
          <Pressable accessibilityRole="button" onPress={onCancel} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text muted style={{ fontSize: 12 }}>حذف از صف</Text>
          </Pressable>
        </>}
      </View>
    </View>
  );
}
