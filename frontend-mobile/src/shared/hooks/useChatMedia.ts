import { useEffect, useRef, useState } from "react";
import { downloadChatMedia } from "../utils/chat-media-download";
import {
  readCachedMedia,
  removeCachedMedia,
  releaseCachedMedia,
} from "../utils/chat-media-cache";
import type { Message } from "../types/platform";
import { onChatMediaCached } from "../utils/chat-media-events";
export function useChatMedia(item: Message) {
  const [uri, setUri] = useState("");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState(item.attachmentSize || 0);
  const active = useRef(false),
    locked = useRef(false),
    resource = useRef("");
  const controller = useRef<AbortController | null>(null);
  const type = item.attachmentType || "image/jpeg";
  useEffect(() => {
    let current = true;
    active.current = true;
    setChecking(true);
    setUri("");
    setFailed(false);
    const read = () => readCachedMedia(item.code, type, item.attachmentSize)
      .then((cached) => {
        if (!current || resource.current) {
          if (cached) releaseCachedMedia(cached);
          return;
        }
        if (cached) {
          resource.current = cached;
          setUri(cached);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (current) setChecking(false);
      });
    const unsubscribe = onChatMediaCached(code => {
      if (code === item.code && !resource.current) void read();
    });
    void read();
    return () => {
      unsubscribe();
      current = false;
      active.current = false;
      controller.current?.abort();
      if (resource.current) releaseCachedMedia(resource.current);
      resource.current = "";
    };
  }, [item.code, item.attachmentSize, type]);
  async function load() {
    if (locked.current || checking) return;
    locked.current = true;
    setBusy(true);
    setFailed(false);
    setProgress(null);
    setDownloaded(0);
    const abort = new AbortController();
    controller.current = abort;
    try {
      const update = (value: number, loaded = 0, size?: number) => {
        if (active.current) {
          setProgress(value);
          setDownloaded(loaded);
          if (size) setTotal(size);
        }
      };
      const cached = await downloadChatMedia(item, abort.signal, update);
      if (abort.signal.aborted || !active.current) {
        releaseCachedMedia(cached);
        return;
      }
      if (resource.current) releaseCachedMedia(resource.current);
      resource.current = cached;
      setUri(cached);
      return cached;
    } catch {
      if (active.current && !abort.signal.aborted) setFailed(true);
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }
  function invalidate() {
    void removeCachedMedia(item.code, type).catch(() => undefined);
    if (resource.current) releaseCachedMedia(resource.current);
    resource.current = "";
    setUri("");
    setFailed(true);
  }
  return {
    uri,
    checking,
    busy,
    failed,
    progress,
    downloaded,
    total,
    load,
    invalidate,
  };
}
