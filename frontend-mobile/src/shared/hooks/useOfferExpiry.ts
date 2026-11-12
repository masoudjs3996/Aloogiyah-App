import { useEffect, useState } from "react";
export function useOfferExpiry(end?: string | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!end) return;
    const delay = Date.parse(end) - Date.now();
    if (!Number.isFinite(delay) || delay <= 0) return;
    const t = setTimeout(
      () => tick((n) => n + 1),
      Math.min(delay + 20, 2147483647),
    );
    return () => clearTimeout(t);
  }, [end]);
}
