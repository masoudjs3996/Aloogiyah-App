import { AppModal as Modal } from "../molecules/AppModal";
import ChatMediaPlaceholder from "./ChatMediaPlaceholder";
import React, { useState } from "react";
import { Image,  Platform, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatMedia } from "../../shared/hooks/useChatMedia";
import * as Sharing from "expo-sharing";
import { appAlert } from "../../shared/alerts";
import { Text } from "../atoms/Text";

import { errorMessage } from "../../api/platform";
import type { Message } from "../../shared/types/platform";

export default function ChatImage({ item }: { item: Message }) {
  const {
    uri,
    busy,
    failed,
    progress,
    downloaded,
    total,
    checking,
    load,
    invalidate,
  } = useChatMedia(item);
  const [open, setOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  if (checking)
    return (
      <View
        accessibilityLabel="بررسی فایل دریافت‌شده"
        style={{
          width: 240,
          maxWidth: "100%",
          height: 160,
          borderRadius: 12,
          backgroundColor: "#F1F5F9",
        }}
      />
    );
  if (!uri)
    return (
      <ChatMediaPlaceholder
        item={item}
        busy={busy}
        failed={failed}
        progress={progress}
        downloaded={downloaded}
        total={total}
        onDownload={() => void load().then((cached) => { if (cached) setOpen(true); })}
      />
    );
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="نمایش بزرگ عکس"
        onPress={() => setOpen(true)}
      >
        <Image
          source={{ uri }}
          accessibilityLabel={item.attachmentName}
          resizeMode="contain"
          onLoad={({ nativeEvent }) => {
            const { width, height } = nativeEvent.source;
            if (width > 0 && height > 0) setAspectRatio(width / height);
          }}
          onError={invalidate}
          style={{
            width: 240,
            maxWidth: "100%",
            aspectRatio,
            borderRadius: 12,
          }}
        />
      </Pressable>
      <Modal
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: "#020617",
            padding: 20,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            style={{ padding: 16 }}
          >
            <Text style={{ color: "white" }}>بستن</Text>
          </Pressable>
          <Image
            source={{ uri }}
            accessibilityLabel={item.attachmentName}
            resizeMode="contain"
            onError={() => { setOpen(false); invalidate(); }}
            style={{ flex: 1 }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ذخیره عکس"
            style={{ padding: 16, marginBottom: 24 }}
            onPress={async () => {
              try {
                if (Platform.OS === "web") {
                  const link = document.createElement("a");
                  link.href = uri;
                  link.download = item.attachmentName || "photo.jpg";
                  link.click();
                } else {
                  if (!(await Sharing.isAvailableAsync()))
                    throw new Error(
                      "ذخیره و اشتراک‌گذاری روی این دستگاه در دسترس نیست.",
                    );
                  await Sharing.shareAsync(uri, {
                    mimeType: item.attachmentType,
                    dialogTitle: item.attachmentName,
                  });
                }
              } catch (err) {
                appAlert.alert("عکس دریافت نشد", errorMessage(err));
              }
            }}
          >
            <Text style={{ color: "white", fontSize: 26 }}>↓</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </>
  );
}
