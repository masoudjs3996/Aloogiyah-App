import { Image } from "react-native";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { createVideoPlayer } from "expo-video";
import { File } from "expo-file-system";

type Upload = Blob | { uri: string; name: string; type: string };
export async function createChatPreview(
  file: Upload,
  signal: AbortSignal,
): Promise<string | undefined> {
  if (signal.aborted) return;
  return new Promise(resolve => {
    const finish = (preview?: string) => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      resolve(preview);
    };
    const abort = () => finish();
    const timeout = setTimeout(abort, 8000);
    signal.addEventListener("abort", abort, { once: true });
    void generateChatPreview(file).then(finish, abort);
  });
}

async function generateChatPreview(
  file: Upload,
): Promise<string | undefined> {
  if (!("uri" in file)) return;
  const video =
    file.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.name);
  if (
    !video &&
    !file.type.startsWith("image/") &&
    !/\.(jpe?g|png|webp)$/i.test(file.name)
  )
    return;
  let player: ReturnType<typeof createVideoPlayer> | undefined;
  let thumbnail:
    | Awaited<
        ReturnType<NonNullable<typeof player>["generateThumbnailsAsync"]>
      >[number]
    | undefined;
  let context: ReturnType<typeof ImageManipulator.manipulate> | undefined;
  let rendered:
    Awaited<ReturnType<NonNullable<typeof context>["renderAsync"]>> | undefined;
  let temporary: string | undefined;
  try {
    let width: number, height: number;
    if (video) {
      player = createVideoPlayer(null);
      player.muted = true;
      await player.replaceAsync(file.uri);
      const frames = await player.generateThumbnailsAsync(0, {
        maxWidth: 64,
        maxHeight: 64,
      });
      thumbnail = frames[0];
      if (!thumbnail) return;
      width = thumbnail.width;
      height = thumbnail.height;
      context = ImageManipulator.manipulate(thumbnail);
    } else {
      const dimensions = await Image.getSize(file.uri);
      width = dimensions.width;
      height = dimensions.height;
      context = ImageManipulator.manipulate(file.uri);
    }
    if (Math.max(width, height) > 64)
      context.resize(width >= height ? { width: 64 } : { height: 64 });
    rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.45,
      base64: true,
    });
    temporary = result.uri;
    const preview = result.base64
      ? `data:image/jpeg;base64,${result.base64}`
      : undefined;
    return preview && preview.length <= 12000 ? preview : undefined;
  } catch {
    return undefined;
  } finally {
    rendered?.release();
    context?.release();
    thumbnail?.release();
    player?.release();
    if (temporary) {
      const cached = new File(temporary);
      if (cached.exists) cached.delete();
    }
  }
}
