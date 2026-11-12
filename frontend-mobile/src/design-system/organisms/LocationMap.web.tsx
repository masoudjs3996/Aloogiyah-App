import { createMapHtml, validPoint } from "../../shared/utils/mapHtml";
import React, { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { Text } from "../atoms/Text";
import type { Point } from "../../shared/types/mobile";
import { useLocationMap } from "../../shared/hooks/useLocationMap";
import { LocationSearch } from "./LocationSearch";
export function LocationMap({
  value,
  onChange,
  height = 260,
  placeQuery,
}: {
  value?: Point | null;
  onChange?: (p: Point) => void;
  height?: number;
  placeQuery?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const latitude = value?.latitude;
  const longitude = value?.longitude;
  const interactive = !!onChange;
  const { settings, focus, setFocus } = useLocationMap(
    placeQuery,
    validPoint(value),
  );
  const [ready, setReady] = React.useState(false);
  const initialValue = useRef(value).current;
  const src = useMemo(
    () => createMapHtml(initialValue, interactive, "web", settings.data),
    [initialValue, interactive, settings.data],
  );
  useEffect(() => {
    setReady(false);
  }, [src]);
  useEffect(() => {
    if (ready && focus)
      ref.current?.contentWindow?.postMessage(
        {
          kind: "aloogiyah-focus",
          latitude: focus.latitude,
          longitude: focus.longitude,
        },
        window.location.origin,
      );
  }, [ready, focus]);
  useEffect(() => {
    if (ready && latitude != null && longitude != null) {
      // Updating the chosen point must not reload map images.
      ref.current?.contentWindow?.postMessage(
        { kind: "aloogiyah-point", latitude, longitude },
        window.location.origin,
      );
    }
  }, [ready, latitude, longitude]);
  useEffect(() => {
    const fn = (e: MessageEvent) => {
      if (
        e.source !== ref.current?.contentWindow ||
        e.data?.kind !== "aloogiyah-map"
      )
        return;
      const { latitude, longitude } = e.data;
      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180
      )
        onChange?.({ latitude, longitude });
    };
    window.addEventListener("message", fn);
    return () => window.removeEventListener("message", fn);
  }, [onChange]);
  return (
    <View style={{ marginBottom: 16, gap: 8 }}>
      {onChange && settings.data?.searchEnabled && (
        <LocationSearch city={placeQuery} onNavigate={setFocus} />
      )}
      {settings.isError && (
        <Text muted>در حال بارگذاری نقشه…</Text>
      )}
      <iframe
        ref={ref}
        title="نقشه"
        sandbox="allow-scripts allow-same-origin"
        srcDoc={src}
        onLoad={() => setReady(true)}
        style={{ width: "100%", height, border: 0, borderRadius: 18 }}
      />
      {onChange && <Text muted>برای انتخاب موقعیت، روی نقشه بزنید.</Text>}
    </View>
  );
}
