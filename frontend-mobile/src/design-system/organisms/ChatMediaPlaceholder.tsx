import React from "react";
import { ActivityIndicator, Image, Pressable, View } from "react-native";
import { Text } from "../atoms/Text";
import type { Message } from "../../shared/types/platform";
import { chatFileSize } from "../../shared/utils/chat-file-size";
export default function ChatMediaPlaceholder({
  item,
  busy,
  failed,
  video,
  ready = false,
  progress = null,
  downloaded = 0,
  total = item.attachmentSize || 0,
  onDownload,
}: {
  item: Message;
  busy: boolean;
  failed: boolean;
  video?: boolean;
  ready?: boolean;
  progress?: number | null;
  downloaded?: number;
  total?: number;
  onDownload: () => void;
}) {
  const preview = item.attachmentPreview?.startsWith("data:image/jpeg;base64,")
    ? item.attachmentPreview
    : undefined;
  const percent =
    progress === null ? null : Math.max(0, Math.min(100, progress));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        ready
          ? "پخش فیلم"
          : failed
          ? "تلاش دوباره برای دریافت"
          : video
            ? "دریافت و پخش فیلم"
            : "دریافت عکس"
      }
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onDownload}
      style={{
        width: video ? 210 : 240,
        maxWidth: "100%",
        height: 160,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#1E293B",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 12,
      }}
    >
      {preview && (
        <Image
          source={{ uri: preview }}
          blurRadius={8}
          resizeMode="cover"
          accessible={false}
          style={{ position: "absolute", width: "110%", height: "110%" }}
        />
      )}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      />
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "rgba(0,0,0,0.5)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 26 }}>{ready ? "▶" : "↓"}</Text>
        {busy &&
          (percent === null ? (
            <ActivityIndicator
              color="#6EE7B7"
              size="large"
              style={{ position: "absolute" }}
            />
          ) : (
            Array.from({ length: 60 }, (_, index) => (
              <View
                key={index}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: 56,
                  height: 56,
                  transform: [{ rotate: `${index * 6}deg` }],
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: 2,
                    left: 27,
                    width: 2,
                    height: 4,
                    borderRadius: 1,
                    backgroundColor:
                      index < Math.round(percent * 0.6)
                        ? "#6EE7B7"
                        : "rgba(255,255,255,0.25)",
                  }}
                />
              </View>
            ))
          ))}
      </View>
      <Text style={{ color: "white", fontSize: 11 }}>
        {chatFileSize(total)}
      </Text>
      {busy && (
        <Text
          accessibilityRole="progressbar"
          accessibilityLabel="پیشرفت دانلود"
          accessibilityValue={{ min: 0, max: 100, now: percent ?? undefined }}
          style={{
            color: "white",
            fontSize: 10,
            lineHeight: 18,
            textAlign: "center",
          }}
        >
          {chatFileSize(Math.min(total, downloaded))} دریافت‌شده ·{" "}
          {chatFileSize(Math.max(0, total - downloaded))} باقی‌مانده
        </Text>
      )}
    </Pressable>
  );
}
