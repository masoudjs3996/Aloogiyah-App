import { Platform } from "react-native";
import http from "../../api/http";
import { platformApi } from "../../api/platform";
import type { Message } from "../types/platform";
import { saveCachedMedia } from "./chat-media-cache";

export async function downloadChatMedia(
  item: Message,
  signal?: AbortSignal,
  onProgress?: (percentage: number, loaded?: number, total?: number) => void,
) {
  const bytes = Platform.OS === "web"
    ? await platformApi.downloadChatFile(item.code, onProgress, signal, item.attachmentSize)
    : (await http.get<ArrayBuffer>(`/ChatMessage/${encodeURIComponent(item.code)}/File`, {
      responseType: "arraybuffer",
      timeout: 300000,
      signal,
      onDownloadProgress: event => {
        const total = event.total || item.attachmentSize;
        if (total) onProgress?.(Math.min(100, Math.round(event.loaded * 100 / total)), event.loaded, total);
      },
    })).data;
  const size = bytes instanceof ArrayBuffer ? bytes.byteLength : bytes.size;
  if (!size || (item.attachmentSize && size !== item.attachmentSize))
    throw new Error("فایل کامل دریافت نشد.");
  if (signal?.aborted) throw new Error("دریافت فایل لغو شد.");
  return saveCachedMedia(item.code, item.attachmentType || "image/jpeg", bytes);
}
