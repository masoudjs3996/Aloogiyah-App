const returnPathKey = "auth:return-path";

export function safeReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\\u0000-\u0020]/.test(decoded) || decoded.startsWith("//")) return null;
    const url = new URL(value, "https://local.invalid");
    const pathname = decodeURIComponent(url.pathname);
    if (/^\/(Login|Register|api)(\/|$)/i.test(pathname)) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function rememberReturnPath(path: string) {
  const safe = safeReturnPath(path);
  if (!safe) return;
  try { sessionStorage.setItem(returnPathKey, safe); } catch {}
}

export function getAuthReturnPath(): string {
  const explicit = safeReturnPath(new URLSearchParams(window.location.search).get("next"));
  if (explicit) return explicit;
  try {
    const saved = safeReturnPath(sessionStorage.getItem(returnPathKey));
    if (saved) return saved;
  } catch {}
  return "/";
}

export function redirectAfterAuth() {
  // Reload after writing cookies so protected routes cannot reuse a guest redirect.
  window.location.replace(getAuthReturnPath());
}
