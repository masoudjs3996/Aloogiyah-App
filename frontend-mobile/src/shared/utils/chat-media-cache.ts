import { File, Paths } from "expo-file-system";
import { notifyChatMediaCached } from "./chat-media-events";
function mediaFile(code: string, type: string) {
  const ext =
    type === "video/quicktime"
      ? "mov"
      : type === "video/webm"
        ? "webm"
        : type === "video/mp4"
          ? "mp4"
          : type === "image/png"
            ? "png"
            : type === "image/webp"
              ? "webp"
              : "jpg";
  return new File(
    Paths.cache,
    `chat-media-${code.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`,
  );
}
export async function readCachedMedia(
  code: string,
  type: string,
  size?: number,
): Promise<string | undefined> {
  try {
    const file = mediaFile(code, type);
    return file.exists && file.size > 0 && (!size || file.size === size)
      ? file.uri
      : undefined;
  } catch {
    return undefined;
  }
}
export async function saveCachedMedia(
  code: string,
  type: string,
  data: Blob | ArrayBuffer,
): Promise<string> {
  const bytes = data instanceof ArrayBuffer ? data : await data.arrayBuffer();
  const file = mediaFile(code, type);
  file.create({ overwrite: true });
  file.write(new Uint8Array(bytes));
  return file.uri;
}
export async function cacheSentMedia(code: string, type: string, source: Blob | { uri: string }) {
  if (!("uri" in source)) return;
  const original = new File(source.uri);
  const destination = mediaFile(code, type);
  if (!destination.exists || destination.size !== original.size) {
    if (destination.exists) destination.delete();
    original.copy(destination);
  }
  notifyChatMediaCached(code);
}
export async function removeCachedMedia(
  code: string,
  type: string,
): Promise<void> {
  const file = mediaFile(code, type);
  if (file.exists) file.delete();
}
export async function clearChatMediaCache(): Promise<void> {
  for (const file of Paths.cache.list()) {
    if (file instanceof File && file.name.startsWith("chat-media-")) file.delete();
  }
}
// Cached device files deliberately survive leaving the conversation.
export function releaseCachedMedia(_uri: string) {}
