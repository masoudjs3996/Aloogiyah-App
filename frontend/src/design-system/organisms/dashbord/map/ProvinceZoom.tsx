"use client";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { searchMap } from "@/shared/utils/map-service";

export default function ProvinceZoom({
  provinceName,
  cityName,
  villageName,
  enabled = true,
}: {
  provinceName?: string;
  cityName?: string;
  villageName?: string;
  enabled?: boolean;
}) {
  const map = useMap();
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
    const names = [
      ...new Set([villageName, cityName, provinceName].filter(Boolean)),
    ];
    if (!enabled || !names.length) return;
    const controller = new AbortController();
    void searchMap(names.join("، "), controller.signal)
      .then((places) => {
        if (controller.signal.aborted) return;
        const place = places[0];
        if (!place) {
          setError("محدوده پیدا نشد؛ موقعیت را روی نقشه انتخاب کنید.");
          return;
        }
        map.fitBounds(
          [
            [place.bounds[0], place.bounds[2]],
            [place.bounds[1], place.bounds[3]],
          ],
          {
            padding: [24, 24],
            maxZoom: villageName ? 15 : cityName ? 13 : 10,
          },
        );
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("زوم خودکار در دسترس نیست؛ موقعیت را روی نقشه انتخاب کنید.");
      });
    return () => controller.abort();
  }, [provinceName, cityName, villageName, enabled, map]);
  return enabled && error ? (
    <div
      role="status"
      dir="rtl"
      className="pointer-events-none absolute bottom-20 right-3 z-[1000] max-w-[80%] rounded-lg bg-white p-2 text-xs text-red-600"
    >
      {error}
    </div>
  ) : null;
}
