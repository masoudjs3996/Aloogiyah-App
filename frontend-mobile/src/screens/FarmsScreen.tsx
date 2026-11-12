import React, { useState } from "react";
import { Image, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { Props } from "../navigation/types";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import { api } from "../api/mobile";
import { imageUrl } from "../shared/utils/format";
export function FarmsScreen({ navigation }: Props<"Farms">) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["farms", page, search],
    queryFn: ({ signal }) =>
      api.farms(
        { PageNumber: page, PageSize: 12, Name: search || undefined },
        signal,
      ),
  });
  return (
    <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Field
        label="جست‌وجوی مزارع"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />
      <QueryState
        loading={q.isLoading}
        error={q.error}
        empty={q.data?.items.length === 0}
        retry={() => q.refetch()}
      />
      {q.data?.items.map((f) => (
        <Card key={f.code}>
          {imageUrl(f.imageUrl) && (
            <Image
              source={{ uri: imageUrl(f.imageUrl) }}
              style={{ height: 170, borderRadius: 16 }}
            />
          )}
          <Text bold style={{ fontSize: 20 }}>
            {f.name}
          </Text>
          <Text numberOfLines={2}>{f.description}</Text>
          <Button
            outline
            title="جزئیات مزرعه"
            onPress={() => navigation.navigate("Farm", { code: f.code })}
          />
        </Card>
      ))}
      <View style={{ flexDirection: "row-reverse", gap: 10 }}>
        <Button
          style={{ flex: 1 }}
          outline
          title="صفحهٔ قبل"
          disabled={page === 1}
          onPress={() => setPage(page - 1)}
        />
        <Button
          style={{ flex: 1 }}
          outline
          title="صفحهٔ بعد"
          disabled={!q.data || page * q.data.pageSize >= q.data.totalCount}
          onPress={() => setPage(page + 1)}
        />
      </View>
    </Screen>
  );
}
export { FarmScreen } from "./FarmScreen";
