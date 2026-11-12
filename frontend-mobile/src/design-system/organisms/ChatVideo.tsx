import ChatMediaPlaceholder from "./ChatMediaPlaceholder";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppModal } from "../molecules/AppModal";
import { useChatMedia } from "../../shared/hooks/useChatMedia";
import * as Sharing from "expo-sharing";
import { Text } from "../atoms/Text";
import ChatVideoPlayer from "./ChatVideoPlayer";

import { errorMessage } from "../../api/platform";
import { appAlert } from "../../shared/alerts";
import type { Message } from "../../shared/types/platform";

export default function ChatVideo({ item }: { item: Message }) {
  const { uri, busy, failed, progress, downloaded, total, checking, load, invalidate } =
    useChatMedia(item);
  const [open, setOpen] = useState(false);
  async function download() {
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = uri;
        link.download = item.attachmentName || "video.mp4";
        link.click();
      } else {
        if (!(await Sharing.isAvailableAsync()))
          throw new Error("دریافت فایل روی این دستگاه در دسترس نیست.");
        await Sharing.shareAsync(uri, {
          mimeType: item.attachmentType,
          dialogTitle: item.attachmentName,
        });
      }
    } catch (err) {
      appAlert.alert("فیلم دریافت نشد", errorMessage(err));
    }
  }
  if (checking)
    return (
      <View
        style={{
          width: 210,
          height: 160,
          backgroundColor: "#F1F5F9",
          borderRadius: 12,
        }}
      />
    );
  return (
    <View style={{ width: 210, maxWidth: "100%" }}>
      <ChatMediaPlaceholder item={item} busy={busy} failed={failed} progress={progress}
        downloaded={downloaded} total={total} video ready={!!uri}
        onDownload={() => {
          if (uri) setOpen(true);
          else void load().then((cached) => { if (cached) setOpen(true); });
        }} />
      {!!uri && open && (
        <AppModal animationType="fade" onRequestClose={() => setOpen(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#020617", paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", gap: 8 }}>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={{ padding: 14 }}>
                <Text bold style={{ color: "white" }}>بستن</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={{ padding: 14 }} onPress={() => void download()}>
                <Text style={{ color: "white" }}>{Platform.OS === "web" ? "ذخیره فیلم" : "اشتراک‌گذاری فیلم"}</Text>
              </Pressable>
            </View>
            <ChatVideoPlayer uri={uri} onRetry={() => { setOpen(false); invalidate(); }} />
          </SafeAreaView>
        </AppModal>
      )}
    </View>
  );
}
