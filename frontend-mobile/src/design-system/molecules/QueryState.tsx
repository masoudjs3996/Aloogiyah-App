import React from "react";
import { View, ActivityIndicator } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { errorMessage } from "../../api/platform";
import { theme } from "../../shared/theme";
export function QueryState({
  loading,
  error,
  empty,
  retry,
  emptyText = "هنوز چیزی اینجا نیست",
  emptyHint = "اطلاعات جدید در این بخش نمایش داده می‌شود.",
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  retry?: () => void;
  emptyText?: string;
  emptyHint?: string;
}) {
  if (!loading && !error && !empty) return null;
  return (
    <View
      style={{
        padding: 24,
        minHeight: 190,
        backgroundColor: theme.white,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: theme.border,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginVertical: 12,
      }}
    >
      {loading ? (
        <>
          <ActivityIndicator size="large" color={theme.green} />
          <Text muted>در حال دریافت اطلاعات…</Text>
        </>
      ) : error ? (
        <>
          <Ionicons
            name="alert-circle-outline"
            size={38}
            color={theme.danger}
          />
          <Text style={{ textAlign: "center", fontSize: 13 }}>
            {errorMessage(error)}
          </Text>
          {retry && <Button title="تلاش دوباره" onPress={retry} />}
        </>
      ) : (
        <>
          <Ionicons name="file-tray-outline" size={44} color={theme.accent} />
          <Text bold style={{ textAlign: "center", fontSize: 13 }}>
            {emptyText}
          </Text>
          <Text muted style={{ textAlign: "center", fontSize: 12 }}>
            {emptyHint}
          </Text>
        </>
      )}
    </View>
  );
}
