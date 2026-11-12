import React, { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { platformApi } from "../api/platform";
import { useAuth } from "../shared/providers/AuthProvider";
import { money, date, number } from "../shared/utils/format";
import {
  View,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../shared/theme";
import { Screen } from "../design-system/templates/Screen";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { Card } from "../design-system/atoms/Card";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { Badge } from "../design-system/atoms/Badge";
import { QueryState } from "../design-system/molecules/QueryState";
import {
  orderStatusLabel,
  orderStatuses,
  isStoppedOrder,
} from "../shared/order-statuses";
import { OrderProgress } from "../design-system/molecules/OrderProgress";
import { useRoles } from "../shared/hooks/useRoles";
import type { Props } from "../navigation/types";
export function OrdersScreen({ navigation }: Props<"Orders">) {
  const [view, setView] = useState("Buyer");
  const [status, setStatus] = useState("");
  const roles = useRoles();
  const q = useInfiniteQuery({
    queryKey: ["orders", view, status],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      platformApi.orders(
        {
          PageNumber: pageParam,
          PageSize: 15,
          View: view,
          IncludeUnpaid: view === "Buyer",
          StatusCode: status || undefined,
        },
        signal,
      ),
    getNextPageParam: (last) =>
      last.pageNumber * last.pageSize < last.totalCount
        ? last.pageNumber + 1
        : undefined,
    enabled: useAuth().signedIn,
  });
  const items = [
    ...new Map(
      q.data?.pages
        .flatMap((page) => page.items)
        .map((item) => [item.code, item]) || [],
    ).values(),
  ];
  return (
    <AuthGate>
      <Screen scroll={false}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          onRefresh={() => q.refetch()}
          refreshing={q.isRefetching && !q.isFetchingNextPage}
          ListHeaderComponent={
            <View>
              <Text bold style={{ fontSize: 20, marginBottom: 20 }}>
                سفارش‌های من
              </Text>
              <View
                style={{
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                  borderRadius: 16,
                  padding: 8,
                  marginBottom: 20,
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ direction: "ltr", transform: [{ scaleX: -1 }] }}
                  contentContainerStyle={{
                    direction: "ltr",
                    flexDirection: "row",
                    gap: 8,
                    minWidth: "100%",
                  }}
                  accessibilityLabel="نوع سفارش"
                >
                  {[
                    { value: "Buyer", label: "خریدهای من" },
                    ...(roles.has("Farmer")
                      ? [{ value: "Seller", label: "فروش‌های مزارع من" }]
                      : []),
                  ].map((tab) => (
                    <Pressable
                      key={tab.value}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: view === tab.value }}
                      onPress={() => {
                        setView(tab.value);
                      }}
                      style={{
                        transform: [{ scaleX: -1 }],
                        flexShrink: 0,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor:
                          view === tab.value ? "#047857" : "transparent",
                      }}
                    >
                      <Text
                        bold
                        style={{
                          color: view === tab.value ? "white" : theme.muted,
                          fontSize: 12,
                        }}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: 16,
                  padding: 8,
                  marginBottom: 24,
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ direction: "ltr", transform: [{ scaleX: -1 }] }}
                  contentContainerStyle={{
                    direction: "ltr",
                    flexDirection: "row",
                    gap: 8,
                    minWidth: "100%",
                  }}
                  accessibilityLabel="فیلتر وضعیت"
                >
                  {orderStatuses.map((tab) => {
                    const selected = status === tab.code;
                    const stopped = isStoppedOrder(tab.code);
                    return (
                      <Pressable
                        key={tab.code}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setStatus(tab.code);
                        }}
                        style={{
                          transform: [{ scaleX: -1 }],
                          flexShrink: 0,
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 24,
                          borderWidth: 1,
                          borderColor: selected
                            ? stopped
                              ? "#FEE2E2"
                              : "#D1FAE5"
                            : "transparent",
                          backgroundColor: selected
                            ? stopped
                              ? "#FEF2F2"
                              : "white"
                            : "transparent",
                        }}
                      >
                        <Text
                          bold
                          style={{
                            color: stopped
                              ? "#DC2626"
                              : selected
                                ? "#065F46"
                                : theme.muted,
                            fontSize: 12,
                          }}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <QueryState
                loading={q.isLoading}
                error={!q.data ? q.error : undefined}
                empty={!q.isLoading && !q.error && items.length === 0}
                retry={() => q.refetch()}
              />
            </View>
          }
          renderItem={({ item: o }) => (
            <Card key={o.code}>
              <View
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Ionicons
                  name="storefront-outline"
                  color={theme.green}
                  size={24}
                />
                <View style={{ flex: 1 }}>
                  <Text bold>{o.farmName}</Text>
                  <Text muted style={{ fontSize: 11 }}>
                    {number(o.orderItems.length)} قلم کالا
                  </Text>
                </View>
                <Badge title={orderStatusLabel(o.statusCode, o.statusTitle)} />
              </View>
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  padding: 12,
                  borderRadius: 16,
                }}
              >
                <Text bold style={{ fontSize: 13 }}>
                  {o.orderItems.map((item) => item.productName).join("، ")}
                </Text>
              </View>
              <OrderProgress
                orderItems={o.orderItems}
                statusCode={o.statusCode}
                statusTitle={o.statusTitle}
                history={o.history}
              />
              <Text muted>
                {date(o.createdAt)} • {o.code}
              </Text>
              <Text bold>{money(o.totalPrice)}</Text>
              <Text>{o.isPaid ? "پرداخت شده" : "پرداخت نشده"}</Text>
              <Button
                outline
                title="جزئیات و پیگیری سفارش"
                onPress={() => navigation.navigate("Order", { code: o.code })}
              />
            </Card>
          )}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetching && !q.isFetchNextPageError)
              void q.fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            <View style={{ paddingVertical: 12 }}>
              {q.isFetchingNextPage && (
                <ActivityIndicator
                  accessibilityLabel="بارگذاری سفارش‌های بیشتر"
                  color={theme.green}
                />
              )}
              <QueryState
                error={q.isFetchNextPageError ? q.error : undefined}
                retry={() => q.fetchNextPage()}
              />
            </View>
          }
        />
      </Screen>
    </AuthGate>
  );
}
export { OrderScreen } from "./OrderScreen";
