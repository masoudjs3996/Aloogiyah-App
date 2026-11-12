import React from "react";
import { View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../shared/theme";
import { CartItemRow } from "../design-system/molecules/CartItemRow";
import { useQuery } from "@tanstack/react-query";
import type { Props } from "../navigation/types";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import { platformApi } from "../api/platform";
import { useAuth } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { money, number } from "../shared/utils/format";
export function CartScreen({ navigation }: Props<"Cart">) {
  const { signedIn } = useAuth();
  const q = useQuery({
    queryKey: ["cart", signedIn],
    queryFn: platformApi.cart,
  });
  const { busy, run } = useAction();
  const c = q.data;
  return (
    <Screen
      title="سبد خرید"
      onRefresh={() => q.refetch()}
      refreshing={q.isRefetching}
    >
      <QueryState
        loading={q.isLoading}
        error={q.error}
        retry={() => q.refetch()}
      />
      {!q.isLoading && !q.error && c?.itemCount === 0 && (
        <Card style={{ alignItems: "center", paddingVertical: 36 }}>
          <Ionicons name="bag-outline" size={60} color={theme.accent} />
          <Text muted>سبد خرید شما خالی است.</Text>
          <Button
            title="مشاهده محصولات"
            onPress={() => navigation.navigate("Products")}
          />
        </Card>
      )}
      {c?.farms.map((f) => (
        <Card key={f.farmCode}>
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              borderBottomWidth: 1,
              borderColor: theme.border,
              paddingBottom: 12,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`مشاهده مزرعه ${f.farmName}`}
              onPress={() => navigation.navigate("Farm", { code: f.farmCode })}
            >
              <Text bold>{f.farmName}</Text>
            </Pressable>
            <Text style={{ color: theme.green, fontSize: 13 }}>
              {money(f.totalPrice)}
            </Text>
          </View>
          {f.items.map((item) => (
            <CartItemRow
              key={item.code}
              item={item}
              busy={busy}
              onOpen={() =>
                navigation.navigate("Product", { code: item.productCode })
              }
              onChange={(quantity) => {
                void run(() =>
                  platformApi.updateCart({
                    cartId: c.cartId,
                    itemCode: item.code,
                    quantity,
                  }),
                );
              }}
              onRemove={() => {
                void run(() =>
                  platformApi.removeCart({
                    cartId: c.cartId,
                    itemCode: item.code,
                  }),
                );
              }}
            />
          ))}
        </Card>
      ))}
      {!!c?.itemCount && (
        <Card>
          <Text bold style={{ fontSize: 20 }}>
            خلاصه سبد
          </Text>
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
            }}
          >
            <Text muted>تعداد</Text>
            <Text>{number(c.itemCount)}</Text>
          </View>
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderColor: theme.border,
              paddingTop: 12,
            }}
          >
            <Text>جمع کالاها</Text>
            <Text bold style={{ color: theme.green }}>
              {money(c.totalPrice)}
            </Text>
          </View>
          <Button
            title="ادامه خرید"
            disabled={busy}
            onPress={() =>
              navigation.navigate(signedIn ? "CheckoutDetails" : "Login")
            }
          />
        </Card>
      )}
    </Screen>
  );
}
export { CheckoutDetailsScreen, CheckoutScreen } from "./CheckoutScreens";
