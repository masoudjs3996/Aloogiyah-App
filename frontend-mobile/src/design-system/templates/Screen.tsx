import React, { useContext, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import { NavigationRouteContext } from "@react-navigation/native";
import { HeaderHeightContext } from "@react-navigation/elements";
import { pageHeadings } from "../../shared/page-headings";
import { BottomNavigation } from "../molecules/BottomNavigation";
export function Screen({
  children,
  title,
  scroll = true,
  refreshing = false,
  onRefresh,
  fixedHeader,
  fixedFooter,
  showHeading = true,
}: {
  children: React.ReactNode;
  title?: string;
  showHeading?: boolean;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  fixedHeader?: React.ReactNode;
  fixedFooter?: React.ReactNode;
}) {
  const route = useContext(NavigationRouteContext);
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const insets = useSafeAreaInsets();
  const isChat = route?.name === "ChatRoom";
  const isAuth =
    !!route && ["Login", "Register", "Recovery"].includes(route.name);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS === "web") return;
    setKeyboardVisible(Keyboard.isVisible());
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const heading = route ? pageHeadings[route.name] : undefined;
  return (
    <SafeAreaView
      edges={
        (route &&
          ["Home", "Catalog", "CategoryList", "Requests", "Basket", "Account"].includes(
            route.name,
          )) ||
        keyboardVisible
          ? ["left", "right"]
          : ["left", "right", "bottom"]
      }
      style={{ flex: 1, backgroundColor: theme.bg }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : Platform.OS === "android"
              ? "height"
              : undefined
        }
        keyboardVerticalOffset={isChat ? insets.top : headerHeight}
      >
        {fixedHeader}
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            contentContainerStyle={{
              flexGrow: isAuth ? 1 : undefined,
              padding: 16,
              paddingBottom: 30,
              width: "100%",
              maxWidth: 768,
              alignSelf: "center",
            }}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              ) : undefined
            }
          >
            {showHeading && (title || heading) && (
              <View style={{ marginBottom: 22 }}>
                <Text
                  style={{ color: theme.green, fontSize: 11, marginBottom: 8 }}
                >
                  الو گیاه /{" "}
                  {route &&
                  [
                    "Catalog",
                    "Products",
                    "Farms",
                    "Categories",
                    "CategoryList",
                    "Cart",
                    "Basket",
                  ].includes(route.name)
                    ? "فروشگاه"
                    : "داشبورد"}
                </Text>
                <Text bold style={{ fontSize: 20, lineHeight: 32 }}>
                  {title || heading?.[0]}
                </Text>
                {heading?.[1] && (
                  <Text
                    muted
                    style={{ fontSize: 12, lineHeight: 24, marginTop: 6 }}
                  >
                    {heading[1]}
                  </Text>
                )}
              </View>
            )}
            {children}
          </ScrollView>
        ) : (
          <View
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 768,
              alignSelf: "center",
            }}
          >
            {children}
          </View>
        )}
        {fixedFooter}
        {route && !keyboardVisible && <BottomNavigation />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
