const listeners = new Set<(code: string) => void>();

export function onChatMediaCached(listener: (code: string) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyChatMediaCached(code: string) {
  for (const listener of listeners) listener(code);
}
