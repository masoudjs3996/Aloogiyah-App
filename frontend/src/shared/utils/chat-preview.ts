/** This thumbnail is sent with the message; it never fetches the original from the server. */
export async function createChatPreview(
  file: Blob & { name?: string },
  signal?: AbortSignal,
): Promise<string | undefined> {
  signal?.throwIfAborted();
  const video =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|webm)$/i.test(file.name || "");
  if (
    !video &&
    !file.type.startsWith("image/") &&
    !/\.(jpe?g|png|webp)$/i.test(file.name || "")
  )
    return;
  const url = URL.createObjectURL(file);
  let media: HTMLVideoElement | undefined;
  async function waitForFrame(frame: Promise<void>) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let abort: (() => void) | undefined;
    try {
      await Promise.race([frame, new Promise<never>((_, reject) => {
        abort = () => reject(signal?.reason);
        signal?.addEventListener("abort", abort, { once: true });
        timeout = setTimeout(() => reject(new Error("preview timeout")), 8000);
        if (signal?.aborted) abort();
      })]);
    } finally {
      clearTimeout(timeout);
      if (abort) signal?.removeEventListener("abort", abort);
    }
  }
  try {
    let source: CanvasImageSource, width: number, height: number;
    if (video) {
      media = document.createElement("video");
      media.muted = true;
      media.preload = "auto";
      media.playsInline = true;
      await waitForFrame(new Promise<void>((resolve, reject) => {
        media!.onloadeddata = () => resolve();
        media!.onerror = () => reject(new Error("unsupported video"));
        media!.src = url;
      }));
      source = media;
      width = media.videoWidth;
      height = media.videoHeight;
    } else {
      const image = new Image();
      image.src = url;
      await waitForFrame(image.decode());
      source = image;
      width = image.naturalWidth;
      height = image.naturalHeight;
    }
    if (!width || !height) return;
    const scale = Math.min(1, 64 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const preview = canvas.toDataURL("image/jpeg", 0.45);
    return preview.length <= 12000 ? preview : undefined;
  } catch {
    return undefined;
  } finally {
    if (media) {
      media.onloadeddata = null;
      media.onerror = null;
      media.removeAttribute("src");
      media.load();
    }
    URL.revokeObjectURL(url);
  }
}
