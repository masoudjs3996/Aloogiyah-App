import { useProductColumns } from "../shared/hooks/useProductColumns";
import { usePollingInterval } from "../shared/hooks/usePollingInterval";
import React, { useState } from "react";
import { BusinessInvitation } from "../design-system/organisms/BusinessInvitation";
import { Image, Pressable, View, TextInput } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { Routes } from "../navigation/types";
import { BannerCarousel } from "../design-system/organisms/BannerCarousel";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { Card } from "../design-system/atoms/Card";
import { ProductCard } from "../design-system/molecules/ProductCard";
import { CategoryCard } from "../design-system/molecules/CategoryCard";
import { ServiceGrid } from "../design-system/molecules/ServiceGrid";
import { QueryState } from "../design-system/molecules/QueryState";
import { api } from "../api/mobile";
import { imageUrl } from "../shared/utils/format";
import { theme } from "../shared/theme";
function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        marginTop: 28,
      }}
    >
      <Text bold style={{ fontSize: 19, flex: 1 }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={{
          borderWidth: 1,
          borderColor: "#D1FAE5",
          backgroundColor: "white",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 10,
        }}
      >
        <Text bold style={{ color: theme.green, fontSize: 10 }}>
          {action} ←
        </Text>
      </Pressable>
    </View>
  );
}
export function HomeScreen() {
  const columns = useProductColumns();
  const nav = useNavigation<NativeStackNavigationProp<Routes>>();
  const [search, setSearch] = useState("");
  const products = useQuery({
    queryKey: ["products", "home"],
    refetchInterval: usePollingInterval(180000),
    queryFn: () => api.products({ PageSize: 4 }),
  });
  const cats = useQuery({
    queryKey: ["categories", "home"],
    queryFn: api.homeCategories,
  });
  const farms = useQuery({
    queryKey: ["farms", "home"],
    queryFn: () => api.farms({ PageSize: 3 }),
  });
  const banners = useQuery({ queryKey: ["sliders"], queryFn: api.sliders });
  const refresh = () => {
    void products.refetch();
    void cats.refetch();
    void farms.refetch();
    void banners.refetch();
  };
  const productGrid = (items: NonNullable<typeof products.data>["items"]) => (
    <View
      style={{
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        marginHorizontal: -5,
      }}
    >
      {items.map((p) => (
        <View
          key={p.code}
          style={{ width: columns === 1 ? "100%" : "50%", marginBottom: 6 }}
        >
          <ProductCard
            product={p}
            onPress={() => nav.navigate("Product", { code: p.code })}
          />
        </View>
      ))}
    </View>
  );
  return (
    <Screen
      onRefresh={refresh}
      refreshing={products.isRefetching}
      fixedHeader={
        <View
          style={{
            backgroundColor: theme.white,
            borderBottomWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 768,
              alignSelf: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
              }}
            >
              <TextInput
                accessibilityLabel="جست‌وجوی آگهی‌ها"
                placeholder="نام محصول موردنظرتان…"
                placeholderTextColor={theme.muted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                onSubmitEditing={() =>
                  nav.navigate("Products", { search: search.trim() })
                }
                style={{
                  flex: 1,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  fontFamily: "Vazir",
                  textAlign: "right",
                  color: theme.ink,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="جست‌وجو"
                onPress={() =>
                  nav.navigate("Products", { search: search.trim() })
                }
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="search" size={22} color={theme.green} />
              </Pressable>
            </View>
          </View>
        </View>
      }
    >
      <QueryState
        loading={banners.isLoading}
        error={banners.error}
        retry={() => banners.refetch()}
      />
      <BannerCarousel items={banners.data} />
      <BusinessInvitation
        onJoin={(type) => nav.navigate("Business", { type })}
      />
      <SectionTitle
        title="دسته‌بندی"
        action="همه دسته‌ها"
        onPress={() => nav.navigate("Tabs", { screen: "CategoryList" })}
      />
      <QueryState
        loading={cats.isLoading}
        error={cats.error}
        retry={() => cats.refetch()}
      />
      <View
        style={{
          flexDirection: "row-reverse",
          flexWrap: "wrap",
          marginHorizontal: -5,
        }}
      >
        {cats.data?.slice(0, 6).map((c) => (
          <View key={c.code} style={{ width: "50%", padding: 5 }}>
            <CategoryCard
              category={c}
              onPress={() => nav.navigate("Products", { category: c.code })}
            />
          </View>
        ))}
      </View>
      <SectionTitle
        title="مزارع و گلخانه‌ها"
        action="همه مزارع"
        onPress={() => nav.navigate("Farms")}
      />
      <QueryState
        loading={farms.isLoading}
        error={farms.error}
        retry={() => farms.refetch()}
      />
      {farms.data?.items.map((f) => (
        <Card key={f.code} style={{ padding: 0, overflow: "hidden" }}>
          {imageUrl(f.imageUrl) && (
            <Image
              source={{ uri: imageUrl(f.imageUrl) }}
              style={{ width: "100%", aspectRatio: 16 / 7 }}
              resizeMode="cover"
            />
          )}
          <View style={{ padding: 16, gap: 10 }}>
            <Text bold style={{ fontSize: 17 }}>
              {f.name}
            </Text>
            <Text muted numberOfLines={2} style={{ fontSize: 12 }}>
              {f.description}
            </Text>
            <Button
              title="مشاهده جزئیات"
              onPress={() => nav.navigate("Farm", { code: f.code })}
            />
          </View>
        </Card>
      ))}
      <SectionTitle
        title="آگهی‌های منتخب"
        action="همهٔ آگهی‌ها"
        onPress={() => nav.navigate("Tabs", { screen: "Catalog" })}
      />
      <QueryState
        loading={products.isLoading}
        error={products.error}
        empty={products.data?.items.length === 0}
        retry={() => products.refetch()}
      />
      {products.data && productGrid(products.data.items)}
      <View style={{ marginTop: 28 }}>
        <Text bold style={{ fontSize: 23, marginBottom: 8 }}>
          آگهی و هماهنگی مستقیم
        </Text>
        <Text muted style={{ fontSize: 12, marginBottom: 18 }}>
          محصول مناسب را پیدا کنید و مستقیم با کشاورز هماهنگ شوید.
        </Text>
        <ServiceGrid
          title="دسترسی سریع"
          items={[
            {
              label: "درخواست‌های خرید",
              icon: "paper-plane-outline",
              onPress: () => nav.navigate("Inquiries"),
            },
            {
              label: "گفت‌وگو",
              icon: "chatbubble-outline",
              onPress: () => nav.navigate("Chat"),
            },
            {
              label: "وبلاگ",
              icon: "book-outline",
              onPress: () => nav.navigate("Articles"),
            },
            {
              label: "مزارع",
              icon: "leaf-outline",
              onPress: () => nav.navigate("Farms"),
            },
          ]}
        />
      </View>
    </Screen>
  );
}
