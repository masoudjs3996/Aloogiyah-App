"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { searchMap, type MapPlace } from "@/shared/utils/map-service";

export default function MapSearch({
  city,
  enabled,
}: {
  city?: string;
  enabled: boolean;
}) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef<AbortController | null>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (container.current) {
      L.DomEvent.disableClickPropagation(container.current);
      L.DomEvent.disableScrollPropagation(container.current);
    }
    return () => latest.current?.abort();
  }, [enabled]);
  async function search() {
    if (busy || query.trim().length < 3) return;
    latest.current?.abort();
    const controller = new AbortController();
    latest.current = controller;
    setBusy(true);
    setError("");
    setPlaces([]);
    try {
      const found = await searchMap(
        [city, query.trim()].filter(Boolean).join("، "),
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setPlaces(found);
      if (!found.length)
        setError(
          "مکانی پیدا نشد؛ نام دیگری امتحان کنید یا نقطه را روی نقشه انتخاب کنید.",
        );
    } catch {
      if (!controller.signal.aborted)
        setError(
          "جست‌وجو در دسترس نیست؛ کمی بعد تلاش کنید یا روی نقشه انتخاب کنید.",
        );
    } finally {
      if (latest.current === controller) setBusy(false);
    }
  }
  if (!enabled) return null;
  return (
    <div
      ref={container}
      dir="rtl"
      className="absolute left-12 right-3 top-3 z-[1000] rounded-xl bg-white p-2 shadow sm:left-auto sm:w-80"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2">
        <input
          aria-label="جست‌وجوی محله یا خیابان"
          value={query}
          maxLength={120}
          className="min-w-0 flex-1 rounded-lg border p-2 text-sm"
          placeholder="مثلاً مشهد، خیابان طلاب ۱۱"
          onChange={(event) => {
            latest.current?.abort();
            setBusy(false);
            setQuery(event.target.value);
            setPlaces([]);
            setError("");
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              void search();
            }
          }}
        />
        <button
          type="button"
          className="rounded-lg bg-emerald-700 px-3 text-sm text-white disabled:opacity-50"
          disabled={busy || query.trim().length < 3}
          onClick={() => void search()}
        >
          {busy ? "…" : "جست‌وجو"}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        فقط نام مکان را وارد کنید؛ نتیجه را انتخاب و سپس نقطه دقیق را ثبت کنید.
      </p>
      {error && (
        <p role="status" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {!!places.length && (
        <ul className="mt-2 max-h-36 overflow-auto">
          {places.map((place, n) => (
            <li key={n}>
              <button
                type="button"
                className="w-full border-t p-2 text-right text-xs hover:bg-emerald-50"
                onClick={() => {
                  map.fitBounds(
                    [
                      [place.bounds[0], place.bounds[2]],
                      [place.bounds[1], place.bounds[3]],
                    ],
                    { maxZoom: 17, padding: [20, 20] },
                  );
                  setPlaces([]);
                }}
              >
                {place.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
