import { Platform } from "react-native";
import type { Message } from "../types/platform";
import { readCachedMedia } from "./chat-media-cache";
import { downloadChatMedia } from "./chat-media-download";
import { notifyChatMediaCached } from "./chat-media-events";

export async function saveChatMediaToGallery(item: Message) {
  const type = item.attachmentType;
  if (!type?.startsWith("image/") && !type?.startsWith("video/"))
    throw new Error("فقط عکس و فیلم در گالری ذخیره می‌شوند.");

  // Android 11+ can add app-created media directly through MediaStore.
  const useMediaStore = Platform.OS === "android" && Number(Platform.Version) >= 30;
  let save: (uri: string) => Promise<unknown>;
  if (useMediaStore) {
    const { Asset } = await import("expo-media-library/next");
    save = uri => Asset.create(uri);
  } else {
    const library = await import("expo-media-library");
    const permission = await library.requestPermissionsAsync(true, []);
    if (!permission.granted)
      throw new Error("برای ذخیره، اجازهٔ افزودن عکس و فیلم به گالری را در تنظیمات دستگاه فعال کنید.");
    save = library.saveToLibraryAsync;
  }

  const cached = await readCachedMedia(item.code, type, item.attachmentSize);
  const uri = cached || await downloadChatMedia(item);
  if (!cached) notifyChatMediaCached(item.code);
  await save(uri);
}
