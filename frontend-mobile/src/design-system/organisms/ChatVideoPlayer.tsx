import React from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";
import { Text } from "../atoms/Text";

export default function ChatVideoPlayer({ uri, onRetry, autoPlay = true }: { uri: string; onRetry?: () => void; autoPlay?: boolean }) {
  const player = useVideoPlayer({ uri, contentType: "progressive" }, (instance) => {
    if (autoPlay && Platform.OS !== "web") instance.play();
  });
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  return (
    <View style={{ width: "100%", flex: 1 }}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={{
          width: "100%",
          flex: 1,
          backgroundColor: "#020617",
          borderRadius: 12,
        }}
      />
      {status === "loading" && <ActivityIndicator accessibilityLabel="آماده‌سازی پخش فیلم" color="white" />}
      {status === "error" && (
        <View accessibilityRole="alert">
          <Text style={{ color: "#FDE68A", padding: 8 }}>
            {onRetry
              ? "پخش فیلم ممکن نشد. می‌توانید فایل را دوباره دریافت کنید یا آن را با برنامهٔ دیگری باز کنید."
              : "پیش‌نمایش این فیلم قابل پخش نیست."}
          </Text>
          {onRetry && <Pressable accessibilityRole="button" accessibilityLabel="دریافت دوباره فیلم" onPress={onRetry} style={{ padding: 8 }}>
            <Text style={{ color: "white" }}>دریافت دوباره فیلم</Text>
          </Pressable>}
        </View>
      )}
    </View>
  );
}
