import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { errorMessage, platformApi } from "@/lib/actions/platform";
import type { Message } from "@/shared/types/platform";

export type ChatUpload = {
  code: string;
  conversationCode: string;
  receiverCode: string;
  file: File;
  caption: string;
  attachmentGroupId?: string;
  attachmentGroupPosition?: number;
  createdAt: string;
  state: "queued" | "uploading" | "failed";
  progress: number | null;
  error?: string;
};

function uploadError(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 413) return "حجم فایل بیشتر از حد مجاز سرور است.";
    if (error.response?.status === 429) return "تعداد ارسال‌ها زیاد است. کمی صبر کنید و دوباره تلاش کنید.";
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
      return "مهلت ارسال تمام شد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";
  }
  return errorMessage(error);
}

export function useChatUploadQueue(onSent: (message: Message, upload: ChatUpload) => Promise<void>) {
  const [uploads, setUploads] = useState<ChatUpload[]>([]);
  const queue = useRef<ChatUpload[]>([]);
  const active = useRef<{ code: string; controller: AbortController } | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      queue.current = [];
      active.current?.controller.abort();
    };
  }, []);

  const update = useCallback((items: ChatUpload[]) => {
    queue.current = items;
    if (mounted.current) setUploads(items);
  }, []);

  const sendNext = useCallback(async function sendNext(): Promise<void> {
    if (!mounted.current || active.current) return;
    const item = queue.current.find(upload => upload.state === "queued");
    if (!item) return;

    const controller = new AbortController();
    active.current = { code: item.code, controller };
    const patch = (changes: Partial<ChatUpload>) => update(queue.current.map(upload =>
      upload.code === item.code ? { ...upload, ...changes } : upload));
    patch({ state: "uploading", progress: null, error: undefined });
    try {
      if (!navigator.onLine) throw new Error("ارتباط اینترنت قطع است. بعد از اتصال دوباره تلاش کنید.");
      const message = await platformApi.sendChatFile(item.conversationCode, item.file, item.code, item.caption,
        item.attachmentGroupId ? { id: item.attachmentGroupId, position: item.attachmentGroupPosition! } : undefined,
        controller.signal, progress => {
          if (!controller.signal.aborted) patch({ progress });
        });
      if (mounted.current && !controller.signal.aborted) await onSent(message, item);
      update(queue.current.filter(upload => upload.code !== item.code));
    } catch (error) {
      if (!controller.signal.aborted) patch({ state: "failed", error: uploadError(error) });
    } finally {
      active.current = null;
      void sendNext();
    }
  }, [onSent, update]);

  function enqueue(files: File[], conversationCode: string, receiverCode: string, caption: string) {
    const attachmentGroupId = files.length > 1 ? crypto.randomUUID() : undefined;
    const createdAt = new Date().toISOString();
    const entries = files.map((file, position): ChatUpload => ({
      code: crypto.randomUUID(), conversationCode, receiverCode, file, caption, createdAt,
      attachmentGroupId, attachmentGroupPosition: attachmentGroupId ? position : undefined,
      state: "queued", progress: null,
    }));
    update([...queue.current, ...entries]);
    void sendNext();
  }

  function cancel(code: string) {
    update(queue.current.filter(upload => upload.code !== code));
    if (active.current?.code === code) active.current.controller.abort();
  }

  function retry(code: string) {
    const item = queue.current.find(upload => upload.code === code && upload.state === "failed");
    if (!item) return;
    update([...queue.current.filter(upload => upload.code !== code),
      { ...item, state: "queued", progress: null, error: undefined }]);
    void sendNext();
  }

  return { uploads, enqueue, cancel, retry };
}
