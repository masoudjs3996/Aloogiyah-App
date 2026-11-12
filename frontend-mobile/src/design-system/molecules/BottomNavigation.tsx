import React from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainTabRoutes, Routes } from "../../navigation/types";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
const items = [
  { screen: "Home", label: "خانه", icon: "home-outline" },
  { screen: "Catalog", label: "آگهی‌ها", icon: "bag-outline" },
  { screen: "CategoryList", label: "دسته‌بندی", icon: "grid-outline" },
  { screen: "Requests", label: "درخواست‌ها", icon: "paper-plane-outline" },
  { screen: "Account", label: "داشبورد", icon: "layers-outline" },
] as const;
export function NavigationBar({
  active,
  onSelect,
  tabs = false,
}: {
  active: keyof MainTabRoutes;
  onSelect: (screen: keyof MainTabRoutes) => void;
  tabs?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        backgroundColor: theme.white,
        borderTopWidth: 1,
        borderColor: theme.border,
        paddingTop: 8,
        paddingBottom: tabs ? Math.max(8, insets.bottom) : 8,
      }}
    >
      {items.map((item) => (
        <Pressable
          key={item.screen}
          accessibilityRole={tabs ? "tab" : "button"}
          accessibilityLabel={item.label}
          accessibilityState={{ selected: active === item.screen }}
          onPress={() => onSelect(item.screen)}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            gap: 3,
          }}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={active === item.screen ? theme.green : theme.muted}
          />
          <Text
            bold
            style={{
              fontSize: 10,
              lineHeight: 16,
              color: active === item.screen ? theme.green : theme.muted,
            }}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function BottomNavigation() {
  const navigation = useNavigation<NativeStackNavigationProp<Routes>>();
  const route = useRoute();
  if (
    [
      "Home",
      "Catalog",
      "CategoryList",
      "Requests",
      "Account",
      "Login",
      "Register",
      "Recovery",
    ].includes(route.name)
  )
    return null;
  const active = ["Products", "Product"].includes(route.name)
    ? "Catalog"
    : route.name === "Categories"
      ? "CategoryList"
      : route.name === "Inquiries"
        ? "Requests"
        : "Account";
  return (
    <NavigationBar
      active={active}
      onSelect={(screen) => navigation.popTo("Tabs", { screen })}
    />
  );
}
