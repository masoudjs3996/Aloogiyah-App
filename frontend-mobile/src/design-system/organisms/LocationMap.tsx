import { createMapHtml, validPoint } from "../../shared/utils/mapHtml";
import React, { useRef, useEffect, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import type { Point } from "../../shared/types/mobile";
import { API_BASE } from "../../api/config";
import { useLocationMap } from "../../shared/hooks/useLocationMap";
import { LocationSearch } from "./LocationSearch";
// Same Leaflet/OSM visual language as the web storefront, inside a native WebView.
// All coordinates are validated; only numeric data crosses the HTML boundary.
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
  const ref = useRef<WebView>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const valid = validPoint(value);
  const { settings, focus, setFocus } = useLocationMap(placeQuery, valid);
  const initialValue = useRef(value).current;
  const interactive = !!onChange;
  const html = React.useMemo(
    () => createMapHtml(initialValue, interactive, "native", settings.data),
    [initialValue, interactive, settings.data],
  );
  useEffect(() => {
    setLoaded(false);
  }, [html]);
  useEffect(() => {
    if (loaded && focus)
      ref.current?.injectJavaScript(
        `window.focusPlace&&window.focusPlace(${focus.latitude},${focus.longitude});true;`,
      );
  }, [loaded, focus]);
  useEffect(() => {
    if (loaded && valid)
      ref.current?.injectJavaScript(
        `window.movePoint&&window.movePoint(${value!.latitude},${value!.longitude});true;`,
      );
  }, [loaded, valid, value]);
  const locate = async () => {
    setBusy(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== "granted") {
        setError("اجازهٔ دسترسی به موقعیت داده نشد؛ روی نقشه انتخاب کنید.");
        return;
      }
      const r = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onChange?.({
        latitude: r.coords.latitude,
        longitude: r.coords.longitude,
      });
    } catch {
      setError("موقعیت دریافت نشد؛ روی نقشه انتخاب کنید.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 8, marginBottom: 15 }}>
      {onChange && settings.data?.searchEnabled && (
        <LocationSearch city={placeQuery} onNavigate={setFocus} />
      )}
      {settings.isError && (
        <Text muted>
          در حال بارگذاری نقشه…
        </Text>
      )}
      <View
        style={{
          height,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <WebView
          ref={ref}
          source={{ html, baseUrl: new URL(API_BASE).origin + "/" }}
          applicationNameForUserAgent="Aloogiyah-App/1.0"
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          originWhitelist={["*"]}
          javaScriptEnabled
          onError={() =>
            setError("نقشه بارگذاری نشد؛ اتصال اینترنت را بررسی کنید.")
          }
          onMessage={(e) => {
            if (e.nativeEvent.data === "ready") {
              setLoaded(true);
              return;
            }
            try {
              const p = JSON.parse(e.nativeEvent.data);
              if (
                Number.isFinite(p.latitude) &&
                Number.isFinite(p.longitude) &&
                Math.abs(p.latitude) <= 90 &&
                Math.abs(p.longitude) <= 180
              )
                onChange?.(p);
            } catch {}
          }}
        />
      </View>
      {onChange && (
        <Button
          outline
          busy={busy}
          title="انتخاب موقعیت فعلی من"
          onPress={locate}
        />
      )}
      <Text muted style={{ fontSize: 12 }}>
        {error ||
          (onChange ? "برای انتخاب موقعیت، روی نقشه بزنید." : "موقعیت مزرعه")}
      </Text>
    </View>
  );
}
