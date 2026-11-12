import { BrandLogo } from "../atoms/BrandLogo";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Routes } from "../../navigation/types";
import { useAuth } from "../../shared/providers/AuthProvider";
import { Screen } from "../templates/Screen";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
export function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const nav = useNavigation<NativeStackNavigationProp<Routes>>();
  return auth.signedIn ? (
    <>{children}</>
  ) : (
    <Screen>
      <BrandLogo />
      <Text bold style={{ fontSize: 23, marginVertical: 24 }}>
        به الو گیاه خوش آمدی
      </Text>
      <Text muted style={{ marginBottom: 20 }}>
        برای مدیریت حساب و درخواست‌های خود وارد شوید.
      </Text>
      <Button title="ورود / ثبت‌نام" onPress={() => nav.navigate("Login")} />
    </Screen>
  );
}
