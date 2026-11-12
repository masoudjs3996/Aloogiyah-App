import React from "react";
import { View } from "react-native";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";

export function Pagination({
  page,
  pageSize,
  totalCount,
  onChange,
  busy = false,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onChange: (page: number) => void;
  busy?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
  if (pages === 1 && page === 1) return null;
  return (
    <View style={{ gap: 10, marginVertical: 12 }}>
      <Text muted style={{ textAlign: "center", fontSize: 12 }}>
        صفحه {page.toLocaleString("fa-IR")} از{" "}
        {Math.max(page, pages).toLocaleString("fa-IR")}
      </Text>
      <View style={{ flexDirection: "row-reverse", gap: 10 }}>
        <Button
          outline
          style={{ flex: 1 }}
          title="صفحه قبل"
          disabled={busy || page <= 1}
          onPress={() => onChange(page - 1)}
        />
        <Button
          outline
          style={{ flex: 1 }}
          title="صفحه بعد"
          disabled={busy || page >= pages}
          onPress={() => onChange(page + 1)}
        />
      </View>
    </View>
  );
}
