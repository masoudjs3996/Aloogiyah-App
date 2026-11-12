import ChatImage from "./ChatImage";
import ChatVideo from "./ChatVideo";
import ChatPhotoUpload from "./ChatPhotoUpload";
import { appAlert as Alert } from "../../shared/alerts";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { platformApi, errorMessage } from "../../api/platform";
import http from "../../api/http";
import type { ChatUploadFile } from "../../shared/hooks/useChatUploadQueue";
import type { Message } from "../../shared/types/platform";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { AppModal } from "../molecules/AppModal";
import ChatVideoPlayer from "./ChatVideoPlayer";
import { theme } from "../../shared/theme";

const types = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
function showError(error: unknown) {
  Alert.alert("فایل ارسال یا دریافت نشد", errorMessage(error), undefined, {
    tone: "error",
  });
}
type AttachmentDraft = {
  file: ChatUploadFile;
  room: string;
  receiver: string;
};

export function ChatFileUpload({
  code,
  receiverCode,
  onQueue,
  disabled,
}: {
  code: string;
  receiverCode: string;
  onQueue: (files: ChatUploadFile[], room: string, receiver: string, caption: string) => void;
  disabled: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const currentReceiver = useRef(receiverCode);
  currentReceiver.current = receiverCode;
  const [caption, setCaption] = useState("");
  const [drafts, setDrafts] = useState<AttachmentDraft[]>([]);
  const pending = useRef<AttachmentDraft[]>([]);
  const mounted = useRef(false);
  const replaceDrafts = useCallback((next: AttachmentDraft[]) => {
    pending.current = next;
    if (mounted.current) setDrafts(next);
  }, []);
  const discardDrafts = useCallback(() => {
    for (const draft of pending.current) {
      try { draft.file.dispose?.(); } catch { /* The cache may already have been cleared. */ }
    }
    replaceDrafts([]);
    setCaption("");
  }, [replaceDrafts]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const draft of pending.current) {
        try { draft.file.dispose?.(); } catch { /* The cache may already have been cleared. */ }
      }
      pending.current = [];
    };
  }, []);
  useEffect(() => {
    if (pending.current.some(draft => draft.receiver !== receiverCode)) discardDrafts();
  }, [discardDrafts, receiverCode]);

  function prepare(files: ChatUploadFile[], room: string, receiver: string) {
    if (!mounted.current || currentReceiver.current !== receiver) {
      files.forEach(file => file.dispose?.());
      return;
    }
    setCaption("");
    replaceDrafts(files.map(file => ({ file, room, receiver })));
  }
  async function pickFile() {
    if (lock.current) return;
    lock.current = true;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: types,
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (picked.canceled || currentReceiver.current !== receiverCode) return;
      if (picked.assets.length > 5) throw new Error("حداکثر ۵ فایل را با هم انتخاب کنید.");
      setBusy(true);
      const prepared: ChatUploadFile[] = [];
      for (const asset of picked.assets) {
        if (currentReceiver.current !== receiverCode) break;
        const limit = (/\.(mp4|mov|webm)$/i.test(asset.name) ? 50 : 10) * 1024 * 1024;
        const type = asset.mimeType || "application/octet-stream";
        const source = Platform.OS === "web"
          ? asset.file ?? new globalThis.File([await (await fetch(asset.uri)).blob()], asset.name, { type })
          : { uri: asset.uri, name: asset.name, type };
        const size = "size" in source ? source.size : asset.size ?? new File(asset.uri).size;
        if (!/\.(jpe?g|png|webp|pdf|docx|xlsx|mp4|mov|webm)$/i.test(asset.name) || size <= 0 || size > limit) {
          showError(new Error("فیلم MP4، MOV یا WEBM تا ۵۰ مگابایت و تصویر یا اسناد تا ۱۰ مگابایت مجاز است."));
          continue;
        }
        prepared.push({ source, name: asset.name, size });
      }
      if (currentReceiver.current === receiverCode && prepared.length)
        prepare(prepared, code, receiverCode);
    } catch (err) {
      showError(err);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <ChatPhotoUpload code={code} disabled={disabled || busy || !!drafts.length}
        receiverCode={receiverCode} onQueue={prepare} onPickFile={pickFile} />
      {!!drafts.length && <AppModal animationType="slide" onRequestClose={discardDrafts}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.white }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12 }}>
              <Text bold accessibilityRole="header" style={{ fontSize: 19 }}>تأیید ارسال پیوست</Text>
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
                {drafts.map((draft, index) => (
                  <View key={index} style={{ width: drafts.length === 1 ? "100%" : "48%", padding: 8, gap: 6, borderRadius: 12, backgroundColor: theme.bg }}>
                    <AttachmentDraftPreview file={draft.file} showVideo={drafts.length === 1} />
                    <Text numberOfLines={2}>{draft.file.name}</Text>
                  </View>
                ))}
              </View>
              <TextInput accessibilityLabel="کپشن اختیاری" placeholder="برای فایل‌ها یک کپشن بنویسید…"
                value={caption} multiline maxLength={4000} onChangeText={setCaption}
                style={{ minHeight: 60, padding: 10, borderRadius: 8, backgroundColor: theme.bg, color: theme.ink,
                  textAlign: "right", textAlignVertical: "top", fontFamily: "Vazir" }} />
            </ScrollView>
            <View style={{ flexDirection: "row-reverse", gap: 8, padding: 12 }}>
              <Button title="ارسال" busy={busy} disabled={disabled} onPress={() => {
                const confirmed = pending.current;
                const first = confirmed[0];
                if (disabled || !first || first.receiver !== currentReceiver.current) return;
                replaceDrafts([]);
                setCaption("");
                onQueue(confirmed.map(draft => draft.file), first.room, first.receiver, caption.trim());
              }} />
              <Button outline title="انصراف" onPress={discardDrafts} />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </AppModal>}
    </>
  );
}

function AttachmentDraftPreview({ file, showVideo }: { file: ChatUploadFile; showVideo: boolean }) {
  const [blobUrl, setBlobUrl] = useState("");
  const image = /\.(jpe?g|png|webp)$/i.test(file.name);
  const video = showVideo && /\.(mp4|mov|webm)$/i.test(file.name);
  useEffect(() => {
    if ((!image && !video) || "uri" in file.source) return;
    const url = URL.createObjectURL(file.source);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file.source, image, video]);
  const uri = "uri" in file.source ? file.source.uri : blobUrl;
  if (!uri) return null;
  if (image) return <Image source={{ uri }} resizeMode="contain" style={{ height: 160, width: "100%" }} />;
  if (video) return <View style={{ height: 180 }}><ChatVideoPlayer uri={uri} autoPlay={false} /></View>;
  return null;
}

export function ChatFileDownload({
  item,
  own,
}: {
  item: Message;
  own: boolean;
}) {
  const [busy, setBusy] = useState(false);
  if (item.attachmentType?.startsWith("video/"))
    return <ChatVideo key={item.code} item={item} />;
  if (item.attachmentType?.startsWith("image/"))
    return <ChatImage item={item} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`دریافت ${item.attachmentName}`}
      disabled={busy}
      style={{
        padding: 10,
        borderWidth: 1,
        borderColor: own ? "#6EE7B7" : "#CBD5E1",
        borderRadius: 10,
        marginBottom: 6,
      }}
      onPress={async () => {
        setBusy(true);
        try {
          if (Platform.OS === "web") {
            const blob = await platformApi.downloadChatFile(item.code);
            const url = URL.createObjectURL(blob),
              a = document.createElement("a");
            a.href = url;
            a.download = item.attachmentName!;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          } else {
            if (!(await Sharing.isAvailableAsync()))
              throw new Error("بازکردن فایل روی این دستگاه در دسترس نیست.");
            const response = await http.get<ArrayBuffer>(
              `/ChatMessage/${encodeURIComponent(item.code)}/File`,
              { responseType: "arraybuffer", timeout: 120000 },
            );
            const safeName = item.attachmentName!.replace(
              /[^\p{L}\p{N}._-]/gu,
              "_",
            );
            const shortName =
              safeName.length > 80
                ? `${safeName.slice(0, 64)}.${safeName.split(".").pop()}`
                : safeName;
            const file = new File(
              Paths.cache,
              `chat-${item.code}-${shortName}`,
            );
            file.write(new Uint8Array(response.data));
            await Sharing.shareAsync(file.uri, {
              mimeType: item.attachmentType,
              dialogTitle: item.attachmentName,
            });
          }
        } catch (err) {
          showError(err);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Text style={{ color: own ? "#022C22" : "#047857", fontSize: 13 }}>
        📎 {item.attachmentName}
      </Text>
      <Text style={{ color: own ? "#047857" : "#64748B", fontSize: 11 }}>
        {busy ? "در حال دریافت…" : "دریافت فایل"} ·{" "}
        {Math.ceil((item.attachmentSize || 0) / 1024).toLocaleString("fa-IR")}{" "}
        کیلوبایت
      </Text>
    </Pressable>
  );
}
