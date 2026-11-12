import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { View, Pressable, ScrollView, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import { theme } from "../shared/theme";
import { imageUrl } from "../shared/utils/format";
import type { CategoryOption } from "../shared/types/platform";
import type { Props } from "../navigation/types";

function collectCodes(category: CategoryOption): string[] {
  return [
    category.code,
    ...(category.subCategories ?? []).flatMap(collectCodes),
  ];
}

function Thumbnail({ category }: { category: CategoryOption }) {
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(category.imageUrl);
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: theme.mint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: 36, height: 36 }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Ionicons name="leaf-outline" size={22} color={theme.green} />
      )}
    </View>
  );
}

function Branch({
  category,
  onSelect,
}: {
  category: CategoryOption;
  onSelect: (category: CategoryOption) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = category.subCategories ?? [];
  return (
    <View
      style={{
        borderRightWidth: 1,
        borderColor: theme.border,
        paddingRight: 4,
        marginTop: 4,
      }}
    >
      <View style={{ flexDirection: "row-reverse", alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`مشاهده آگهی‌ها ${category.name}`}
          onPress={() => onSelect(category)}
          style={{
            flex: 1,
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text bold style={{ fontSize: 12, lineHeight: 22 }}>
            {category.name}
          </Text>
        </Pressable>
        {children.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${expanded ? "بستن" : "باز کردن"} زیرشاخه‌های ${category.name}`}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(!expanded)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.green}
            />
          </Pressable>
        )}
      </View>
      {expanded &&
        children.map((child) => (
          <Branch key={child.code} category={child} onSelect={onSelect} />
        ))}
    </View>
  );
}

export function CategoriesScreen({ navigation }: Props<"Categories">) {
  const [activeCode, setActiveCode] = useState("");
  const q = useQuery({
    queryKey: ["category-tree"],
    queryFn: platformApi.categoryTree,
  });
  const roots = q.data ?? [];
  const active =
    roots.find((category) => category.code === activeCode) ?? roots[0];
  const openProducts = (category: CategoryOption) =>
    navigation.navigate("Products", {
      category: category.code,
      categoryCodes: collectCodes(category),
    });
  return (
    <Screen scroll={false}>
      <View style={{ padding: 16 }}>
        <Text bold style={{ fontSize: 23, lineHeight: 36 }}>
          دسته‌بندی آگهی‌ها
        </Text>
        <Text muted style={{ fontSize: 12 }}>
          دسته‌ی اصلی را انتخاب کنید و زیرشاخه‌ها را باز کنید.
        </Text>
      </View>
      <QueryState
        loading={q.isLoading}
        error={q.error}
        empty={q.data?.length === 0}
        retry={() => q.refetch()}
      />
      {active && !q.error && (
        <View
          style={{
            flex: 1,
            flexDirection: "row-reverse",
            marginHorizontal: 10,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: theme.white,
          }}
        >
          <ScrollView
            style={{
              width: 100,
              flexGrow: 0,
              backgroundColor: theme.bg,
              borderLeftWidth: 1,
              borderColor: theme.border,
            }}
            contentContainerStyle={{ padding: 5 }}
          >
            {roots.map((category) => (
              <Pressable
                key={category.code}
                accessibilityRole="button"
                accessibilityState={{ selected: category.code === active.code }}
                onPress={() => setActiveCode(category.code)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  marginBottom: 5,
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 10,
                  backgroundColor:
                    category.code === active.code ? theme.mint : theme.bg,
                }}
              >
                <Thumbnail category={category} />
                <Text
                  bold
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    lineHeight: 20,
                    color:
                      category.code === active.code ? theme.green : theme.muted,
                  }}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView
            key={active.code}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 10 }}
          >
            <Text bold style={{ marginBottom: 10 }}>
              {active.name}
            </Text>
            <Button
              title="مشاهده همهٔ آگهی‌ها"
              onPress={() => openProducts(active)}
              style={{ marginBottom: 12, paddingHorizontal: 6 }}
            />
            {active.subCategories?.length ? (
              active.subCategories.map((child) => (
                <Branch
                  key={child.code}
                  category={child}
                  onSelect={openProducts}
                />
              ))
            ) : (
              <Text muted style={{ fontSize: 12 }}>
                زیرشاخه‌ای برای این دسته ثبت نشده است.
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </Screen>
  );
}
export function NotFoundScreen({ navigation }: Props<"NotFound">) {
  return (
    <Screen>
      <Text bold style={{ fontSize: 60, textAlign: "center", marginTop: 80 }}>
        ۴۰۴ 🌿
      </Text>
      <Text style={{ textAlign: "center", marginBottom: 25 }}>
        این صفحه پیدا نشد.
      </Text>
      <Button
        title="بازگشت به فروشگاه"
        onPress={() => navigation.navigate("Tabs")}
      />
    </Screen>
  );
}
