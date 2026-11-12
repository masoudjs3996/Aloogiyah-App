import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { alertLayers, alertStore, toastStore } from "../../shared/alerts";
import { Text } from "../atoms/Text";

export function AppToastHost({ layer }: { layer?: symbol }) {
  const item = useSyncExternalStore(toastStore.subscribe, toastStore.snapshot, () => null);
  const confirmation = useSyncExternalStore(alertStore.subscribe, alertStore.snapshot, () => null);
  const activeLayer = useSyncExternalStore(alertLayers.subscribe, alertLayers.snapshot, () => undefined);
  const visible = !!item && !confirmation && activeLayer === layer;
  const animation = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets(), { height } = useWindowDimensions();
  useEffect(() => {
    if (!visible || !item) return;
    animation.setValue(0);
    Animated.timing(animation, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(animation, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => { if (finished) toastStore.dismiss(item.id); });
    }, item.tone === "error" || item.message.length > 160 ? 7000 : 4000);
    return () => { clearTimeout(timer); animation.stopAnimation(); };
  }, [visible, item, animation]);
  if (!visible || !item) return null;
  const error = item.tone === "error", color = error ? "#BE123C" : item.tone === "success" ? "#047857" : "#0369A1";
  return <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 10, left: Math.max(12, insets.left + 8), right: Math.max(12, insets.right + 8) }]}>
    <Animated.View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.card, { borderColor: error ? "#FECDD3" : "#CDE9DF", opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
      <Ionicons name={error ? "alert-circle-outline" : item.tone === "success" ? "checkmark-circle-outline" : "information-circle-outline"} color={color} size={26} />
      <View style={{ flex: 1, minWidth: 0 }}><Text bold style={{ color, fontSize: 14 }}>{item.title}</Text><ScrollView style={{ maxHeight: Math.max(80, Math.min(200, height * .28)) }}><Text selectable style={{ color: "#475569", fontSize: 12, lineHeight: 23 }}>{item.message}</Text></ScrollView></View>
      <Pressable accessibilityRole="button" accessibilityLabel="بستن اعلان" hitSlop={6} onPress={() => toastStore.dismiss(item.id)} style={styles.close}><Ionicons name="close" size={20} color="#64748B" /></Pressable>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  host: { position: "absolute", zIndex: 10000, elevation: 10000, alignItems: "center" },
  card: { width: "100%", maxWidth: 540, backgroundColor: "#FFFFFF", borderWidth: 1, borderRadius: 18, padding: 14, gap: 10, flexDirection: "row-reverse", alignItems: "flex-start", boxShadow: "0px 8px 28px rgba(15,23,42,0.14)" },
  close: { width: 32, height: 36, alignItems: "center", justifyContent: "center" },
});
