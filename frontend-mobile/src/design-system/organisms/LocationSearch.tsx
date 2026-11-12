import React, { useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { Field } from "../atoms/Field";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { searchMap, type MapPlace } from "../../shared/utils/map-service";

export function LocationSearch({
  onNavigate,
  city,
}: {
  onNavigate: (place: MapPlace) => void;
  city?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef<AbortController | null>(null);
  React.useEffect(() => () => latest.current?.abort(), []);
  async function search() {
    if (busy || query.trim().length < 3) return;
    latest.current?.abort();
    const controller = new AbortController();
    latest.current = controller;
    setBusy(true);
    setError("");
    setResults([]);
    try {
      const found = await searchMap(
        [city, query.trim()].filter(Boolean).join("، "),
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setResults(found);
      if (!found.length)
        setError(
          "مکانی پیدا نشد؛ نام دیگری امتحان کنید یا روی نقشه انتخاب کنید.",
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
  return (
    <View style={{ gap: 6 }}>
      <Field
        label="جست‌وجوی محله یا خیابان"
        value={query}
        maxLength={120}
        placeholder="مثلاً مشهد، خیابان طلاب ۱۱"
        returnKeyType="search"
        onSubmitEditing={() => void search()}
        onChangeText={(text) => {
          latest.current?.abort();
          setBusy(false);
          setQuery(text);
          setResults([]);
          setError("");
        }}
      />
      <Button
        outline
        compact
        title="جست‌وجو"
        busy={busy}
        disabled={query.trim().length < 3}
        onPress={() => void search()}
      />
      <Text muted style={{ fontSize: 12 }}>
        فقط نام مکان را وارد کنید؛ پس از جست‌وجو نقطه دقیق را روی نقشه انتخاب
        کنید.
      </Text>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: "#b91c1c", fontSize: 12 }}
        >
          {error}
        </Text>
      )}
      {results.map((place, n) => (
        <Pressable
          key={n}
          accessibilityRole="button"
          onPress={() => {
            onNavigate(place);
            setResults([]);
          }}
          style={{
            padding: 10,
            borderWidth: 1,
            borderColor: "#d1fae5",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 12 }}>{place.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}
