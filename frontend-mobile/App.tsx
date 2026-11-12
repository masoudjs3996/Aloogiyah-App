import { isRateLimited, shouldRetryQuery } from "./src/api/queryPolicy";
import React, { useEffect } from "react";
import { ActivityIndicator, I18nManager, AppState, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./src/shared/providers/AuthProvider";
import { Navigation } from "./src/navigation/Navigation";
import { Text } from "./src/design-system/atoms/Text";
import { Button } from "./src/design-system/atoms/Button";
import { Screen } from "./src/design-system/templates/Screen";
import { ErrorBoundary } from "./src/design-system/organisms/ErrorBoundary";
import { theme } from "./src/shared/theme";
import { AppToastHost } from "./src/design-system/organisms/AppToastHost";
import { AppAlertHost } from "./src/design-system/organisms/AppAlertHost";
// Layouts explicitly use row-reverse and right-aligned typography, independent of device language.
I18nManager.allowRTL(false);
const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 30000,
      refetchOnWindowFocus: query => !isRateLimited(query.state.error),
      refetchOnReconnect: query => !isRateLimited(query.state.error),
      refetchOnMount: query => !isRateLimited(query.state.error),
      retryOnMount: false,
    },
    mutations: { retry: false },
  },
});
client.setQueryDefaults(["categories"], { staleTime: 86400000, gcTime: 86400000 });
client.setQueryDefaults(["category-tree"], { staleTime: 86400000, gcTime: 86400000 });
client.setQueryDefaults(["products", "home"], { staleTime: 180000, gcTime: 600000 });
client.setQueryDefaults(["products", "offers"], { staleTime: 180000, gcTime: 600000 });
function Ready() {
  const { ready, startupError, retry } = useAuth();
  if (startupError)
    return (
      <Screen>
        <Text>ذخیره‌سازی امن حساب در دسترس نیست.</Text>
        <Button title="تلاش دوباره" onPress={retry} />
      </Screen>
    );
  return ready ? (
    <Navigation />
  ) : (
    <View
      style={{ flex: 1, justifyContent: "center", backgroundColor: theme.bg }}
    >
      <ActivityIndicator color={theme.green} size="large" />
    </View>
  );
}
export default function App() {
  const [fonts, error] = useFonts({
    Vazir: require("./assets/fonts/Vazirmatn-Regular.ttf"),
    VazirBold: require("./assets/fonts/Vazirmatn-Bold.ttf"),
  });
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) =>
      focusManager.setFocused(s === "active"),
    );
    return () => sub.remove();
  }, []);
  if (!fonts && !error)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.mint,
        }}
      >
        <ActivityIndicator color={theme.green} size="large" />
      </View>
    );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <StatusBar style="dark" />
          <ErrorBoundary>
            <Ready />
          </ErrorBoundary>
          <AppAlertHost />
          <AppToastHost />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
