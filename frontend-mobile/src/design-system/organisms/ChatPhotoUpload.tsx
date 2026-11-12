import { AppModal as Modal } from "../molecules/AppModal";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import Ionicons from "@expo/vector-icons/Ionicons";
import { errorMessage } from "../../api/platform";
import { Text } from "../atoms/Text";
import type { ChatUploadFile } from "../../shared/hooks/useChatUploadQueue";
import { appAlert } from "../../shared/alerts";

export default function ChatPhotoUpload({
  code,
  receiverCode,
  disabled,
  onQueue,
  onPickFile,
}: {
  code: string;
  receiverCode: string;
  disabled: boolean;
  onQueue: (files: ChatUploadFile[], room: string, receiver: string) => void;
  onPickFile: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const lock = useRef(false);
  const currentReceiver = useRef(receiverCode);
  currentReceiver.current = receiverCode;
  useEffect(() => {
    setMenuOpen(false);
    pendingAction.current = null;
  }, [receiverCode]);
  const report = (err: unknown) =>
    appAlert.alert("رسانه ارسال نشد", errorMessage(err), undefined, {
      tone: "error",
    });
  async function pick(camera: boolean, video = false) {
    if (lock.current) return;
    lock.current = true;
    let temporary: File | undefined;
    const prepared: ChatUploadFile[] = [];
    try {
      if (!code || !receiverCode) return;
      if (camera && Platform.OS !== "web") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted)
          throw new Error(
            "برای گرفتن عکس، دسترسی دوربین را در تنظیمات دستگاه فعال کنید.",
          );
      }
      if (video && Platform.OS === "ios") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted)
          throw new Error("برای انتخاب فیلم، دسترسی به گالری را فعال کنید.");
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: video ? ["videos"] : ["images"],
        quality: 1,
        exif: false,
        allowsMultipleSelection: !camera,
        selectionLimit: 5,
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      if (result.assets.length > 5) throw new Error("حداکثر ۵ فایل را با هم انتخاب کنید.");
      setBusy(true);
      for (const asset of result.assets) {
        let uri = asset.uri;
        let name: string;
        let type: string;
        if (video) {
          const sourceName = asset.fileName || asset.uri.split("?")[0];
          const ext = sourceName.match(/\.(mp4|mov|webm)$/i)?.[1]?.toLowerCase()
            || (asset.mimeType === "video/quicktime" ? "mov" : asset.mimeType?.match(/^video\/(mp4|webm)$/)?.[1]);
          if (!ext) throw new Error("فقط فیلم MP4، MOV یا WEBM مجاز است.");
          name = `video-${Date.now()}.${ext}`;
          type = ext === "mov" ? "video/quicktime" : `video/${ext}`;
        } else {
          const context = ImageManipulator.manipulate(uri);
          try {
            if (Math.max(asset.width, asset.height) > 1600)
              context.resize(asset.width >= asset.height ? { width: 1600 } : { height: 1600 });
            const rendered = await context.renderAsync();
            try {
              uri = (await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })).uri;
            } finally { rendered.release(); }
          } finally { context.release(); }
          if (Platform.OS !== "web") temporary = new File(uri);
          name = `photo-${Date.now()}.jpg`;
          type = "image/jpeg";
        }
        const source = Platform.OS === "web"
          ? new globalThis.File([await (await fetch(uri)).blob()], name, { type })
          : { uri, name, type };
        const size = "size" in source ? source.size : new File(uri).size;
        if (size <= 0 || size > (video ? 50 : 10) * 1024 * 1024)
          throw new Error(video ? "حداکثر حجم فیلم ۵۰ مگابایت است." : "حداکثر حجم عکس ۱۰ مگابایت است.");
        if (currentReceiver.current !== receiverCode) return;
        const ownedFile = temporary;
        prepared.push({ source, name, size, dispose: ownedFile ? () => {
          if (ownedFile.exists) ownedFile.delete();
        } : undefined });
        temporary = undefined;
      }
      onQueue(prepared.splice(0), code, receiverCode);
    } catch (err) {
      report(err);
    } finally {
      for (const file of prepared) file.dispose?.();
      try { if (temporary?.exists) temporary.delete(); } catch { /* Cache can be reclaimed by the device. */ }
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="افزودن پیوست"
        accessibilityState={{
          expanded: menuOpen,
          disabled: disabled || busy,
        }}
        disabled={disabled || busy}
        style={{
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled || busy ? 0.5 : 1,
        }}
        onPress={() => setMenuOpen(true)}
      >
        <Ionicons
          name={busy ? "hourglass-outline" : "attach-outline"}
          size={24}
          color="#047857"
        />
      </Pressable>
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        onDismiss={() => {
          const action = pendingAction.current;
          pendingAction.current = null;
          action?.();
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="بستن گزینه‌های پیوست"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setMenuOpen(false)}
          />
          <View
            accessibilityViewIsModal
            style={{
              backgroundColor: "white",
              padding: 20,
              paddingBottom: 40,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <Text bold style={{ textAlign: "right", marginBottom: 16 }}>
              افزودن پیوست
            </Text>
            <View
              style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}
            >
              {(["photo", "camera", "video", "file"] as const).map((kind) => (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  accessibilityLabel={
                    kind === "photo"
                      ? "عکس"
                      : kind === "camera"
                        ? "دوربین"
                        : kind === "video"
                          ? "ویدئو"
                          : "فایل"
                  }
                  style={{
                    width: "48%",
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 12,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: "#ECFDF5",
                  }}
                  onPress={() => {
                    const action = () => {
                      if (kind === "file") void onPickFile();
                      else void pick(kind === "camera", kind === "video");
                    };
                    if (Platform.OS === "ios") pendingAction.current = action;
                    setMenuOpen(false);
                    if (Platform.OS !== "ios") action();
                  }}
                >
                  <Ionicons
                    name={
                      kind === "photo"
                        ? "image-outline"
                        : kind === "camera"
                          ? "camera-outline"
                          : kind === "video"
                            ? "videocam-outline"
                            : "document-outline"
                    }
                    size={23}
                    color="#047857"
                  />
                  <Text style={{ color: "#065F46" }}>
                    {kind === "photo"
                      ? "عکس"
                      : kind === "camera"
                        ? "دوربین"
                        : kind === "video"
                          ? "ویدئو"
                          : "فایل"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              style={{ padding: 16, alignItems: "center", marginTop: 8 }}
              onPress={() => setMenuOpen(false)}
            >
              <Text>بستن</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {busy && (
        <ActivityIndicator
          accessibilityLabel="آماده‌سازی عکس"
          color="#047857"
        />
      )}
    </>
  );
}
