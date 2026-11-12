import { platformApi } from "@/lib/actions/platform";
import type { Message } from "@/shared/types/platform";
import { readCachedMedia, releaseCachedMedia } from "./chat-media-cache";

export async function downloadChatAttachment(item: Message) {
  const name = item.attachmentName;
  if (!name) return;
  const cached = await readCachedMedia(item.code, item.attachmentType || "application/octet-stream", item.attachmentSize);
  const url = cached || URL.createObjectURL(await platformApi.downloadChatFile(item.code));
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  } finally {
    setTimeout(() => releaseCachedMedia(url), 60_000);
  }
}
