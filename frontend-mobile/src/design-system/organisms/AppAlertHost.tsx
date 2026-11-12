import React, { useEffect, useSyncExternalStore } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { alertStore, appAlert, type AppAlertButton } from "../../shared/alerts";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { errorMessage } from "../../api/platform";

const palettes = {
  error: {
    color: "#BE123C",
    soft: "#FFF1F2",
    border: "#FFE4E6",
    icon: "alert-circle-outline",
  },
  success: {
    color: "#047857",
    soft: "#ECFDF5",
    border: "#D1FAE5",
    icon: "checkmark-circle-outline",
  },
  info: {
    color: "#047857",
    soft: "#ECFDF5",
    border: "#D1FAE5",
    icon: "information-circle-outline",
  },
  confirm: {
    color: "#B45309",
    soft: "#FFFBEB",
    border: "#FEF3C7",
    icon: "help-circle-outline",
  },
} as const;

export function AppAlertHost() {
  const item = useSyncExternalStore(
    alertStore.subscribe,
    alertStore.snapshot,
    () => null,
  );
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (item) Keyboard.dismiss();
  }, [item]);
  if (!item) return null;
  const palette = palettes[item.tone];
  const choose = (button?: AppAlertButton) => {
    // A double tap must never repeat a destructive operation.
    if (!alertStore.dismiss(item.id)) return;
    try {
      void Promise.resolve(button?.onPress?.()).catch((error) =>
        appAlert.alert("عملیات انجام نشد", errorMessage(error), undefined, {
          tone: "error",
        }),
      );
    } catch (error) {
      appAlert.alert("عملیات انجام نشد", errorMessage(error), undefined, {
        tone: "error",
      });
    }
  };
  const cancel = () =>
    choose(item.buttons.find((button) => button.style === "cancel"));
  const actions = [
    ...item.buttons.filter((button) => button.style !== "cancel"),
    ...item.buttons.filter((button) => button.style === "cancel"),
  ];
  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancel}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(24, insets.top + 16),
            paddingBottom: Math.max(24, insets.bottom + 16),
          },
        ]}
      >
        <Pressable
          accessibilityLabel="بستن پیام"
          accessibilityRole="button"
          onPress={cancel}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={styles.card}
        >
          <View
            style={[
              styles.header,
              { backgroundColor: palette.soft, borderColor: palette.border },
            ]}
          >
            <View style={[styles.icon, { borderColor: palette.border }]}>
              <Ionicons name={palette.icon} size={32} color={palette.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: palette.color, fontSize: 11, marginBottom: 3 }}
              >
                الو گیاه
              </Text>
              <Text
                bold
                accessibilityRole="header"
                style={{ fontSize: 19, lineHeight: 30 }}
              >
                {item.title}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="بستن پیام"
              onPress={cancel}
              style={styles.close}
            >
              <Ionicons name="close-outline" size={22} color="#64748B" />
            </Pressable>
          </View>
          <ScrollView
            style={{
              flexShrink: 1,
              maxHeight: Math.max(
                100,
                height - insets.top - insets.bottom - 270,
              ),
            }}
            contentContainerStyle={{ padding: 24 }}
          >
            <Text
              selectable
              style={{ color: "#475569", fontSize: 14, lineHeight: 29 }}
            >
              {item.message}
            </Text>
          </ScrollView>
          <View style={styles.actions}>
            {actions.map((button, index) => {
              const secondary = button.style === "cancel";
              const color =
                button.style === "destructive"
                  ? "#BE123C"
                  : item.tone === "error"
                    ? palette.color
                    : "#047857";
              return (
                <Button
                  key={`${item.id}-${index}`}
                  title={button.text}
                  onPress={() => choose(button)}
                  outline={secondary}
                  style={{
                    flexGrow: 1,
                    flexBasis: actions.length === 2 ? "45%" : "100%",
                    ...(secondary
                      ? {}
                      : { backgroundColor: color, borderColor: color }),
                  }}
                />
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(15,23,42,0.48)",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "100%",
    backgroundColor: "white",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    boxShadow: "0px 20px 60px rgba(15,23,42,0.2)",
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "white",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 10,
    padding: 20,
    paddingTop: 16,
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
});
