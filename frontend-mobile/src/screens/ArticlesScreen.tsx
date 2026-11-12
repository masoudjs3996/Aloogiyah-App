import { Pagination } from "../design-system/molecules/Pagination";
import React, { useState } from "react";
import { useWindowDimensions, Linking } from "react-native";
import RenderHTML from "react-native-render-html";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import { date } from "../shared/utils/format";
import type { Props } from "../navigation/types";
export function ArticlesScreen({ navigation }: Props<"Articles">) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["articles", page, search],
    queryFn: () =>
      platformApi.articles({
        PageNumber: page,
        PageSize: 12,
        SearchTerm: search || undefined,
      }),
  });
  return (
    <Screen>
      <Field
        label="جست‌وجوی مقالات"
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
      {q.data?.items.map((a) => (
        <Card key={a.code}>
          <Text bold style={{ fontSize: 21 }}>
            {a.title}
          </Text>
          <Text numberOfLines={3}>{a.summary}</Text>
          <Text muted>{date(a.createdAt)}</Text>
          <Button
            outline
            title="خواندن مقاله"
            onPress={() => navigation.navigate("Article", { code: a.code })}
          />
        </Card>
      ))}
      <Pagination
        page={page}
        pageSize={q.data?.pageSize || 20}
        totalCount={q.data?.totalCount || 0}
        busy={q.isFetching}
        onChange={setPage}
      />
    </Screen>
  );
}
export function ArticleScreen({ route, navigation }: Props<"Article">) {
  const q = useQuery({
    queryKey: ["article", route.params.code],
    queryFn: () => platformApi.article(route.params.code),
  });
  const { width } = useWindowDimensions();
  const a = q.data;
  return (
    <Screen>
      <QueryState
        loading={q.isLoading}
        error={q.error}
        retry={() => q.refetch()}
      />
      {a && (
        <Card>
          <Text bold style={{ fontSize: 25, lineHeight: 38 }}>
            {a.title}
          </Text>
          <Text muted>{date(a.createdAt)}</Text>
          <RenderHTML
            contentWidth={width - 64}
            source={{ html: a.content }}
            ignoredDomTags={[
              "script",
              "iframe",
              "object",
              "embed",
              "style",
              "form",
              "input",
            ]}
            baseStyle={{
              fontFamily: "Vazir",
              color: "#222A26",
              textAlign: "right",
              lineHeight: 28,
            }}
            systemFonts={["Vazir", "VazirBold"]}
            renderersProps={{
              a: {
                onPress: (_, href) => {
                  if (/^https?:\/\//i.test(href)) Linking.openURL(href);
                },
              },
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
