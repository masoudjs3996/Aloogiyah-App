import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { Card } from "../design-system/atoms/Card";
import { Button } from "../design-system/atoms/Button";
import { Text } from "../design-system/atoms/Text";
import { QueryState } from "../design-system/molecules/QueryState";
import { useAction } from "../shared/hooks/useAction";
import { imageUrl, money, number } from "../shared/utils/format";
import { saleUnitLabel } from "../shared/utils/sale-units";
import { theme } from "../shared/theme";
import type { Routes } from "../navigation/types";
import type { ProductInquiry } from "../shared/types/platform";

const statusLabel: Record<string, string> = { Requested: "در حال بررسی", Contacted: "در حال هماهنگی", Agreed: "توافق شده", Declined: "رد شده", Cancelled: "لغو شده" };

function InquiryThumbnail({ inquiry }: { inquiry: ProductInquiry }) {
  const uri = imageUrl(inquiry.primaryImageUrl);
  const [failedUri, setFailedUri] = useState<string>();
  return (
    <View style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: theme.mint }}>
      {uri && uri !== failedUri ? (
        <Image source={{ uri }} accessibilityLabel={inquiry.productName} resizeMode="cover"
          style={{ width: "100%", height: "100%" }} onError={() => setFailedUri(uri)} />
      ) : <Ionicons name="leaf-outline" size={24} color={theme.green} />}
    </View>
  );
}

export function ProductInquiriesScreen() {
  const [role, setRole] = useState<"Buyer" | "Seller">("Buyer");
  const [filter, setFilter] = useState<"All" | "Pending" | "Reviewed">("All");
  const nav = useNavigation<NativeStackNavigationProp<Routes>>();
  const client = useQueryClient();
  const { busy, run } = useAction();
  const q = useInfiniteQuery({
    queryKey: ["product-inquiries", role, filter],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => platformApi.productInquiries(role, filter, pageParam),
    getNextPageParam: page => page.pageNumber * page.pageSize < page.totalCount ? page.pageNumber + 1 : undefined,
  });
  const items = q.data?.pages.flatMap(page => page.items) ?? [];
  const farms = new Map<string, ProductInquiry[]>();
  for (const item of items) {
    const key = item.farmCode || item.code;
    const group = farms.get(key);
    if (group) group.push(item);
    else farms.set(key, [item]);
  }
  const act = (code: string, status: "Contacted" | "Agreed" | "Declined" | "Cancelled", message: string) => run(async () => {
    await platformApi.actProductInquiry(code, status);
    await client.invalidateQueries({ queryKey: ["product-inquiries"] });
  }, message);
  return <AuthGate><Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
    <View style={{ gap: 8, marginBottom: 18 }}><Text bold style={{ fontSize: 22 }}>درخواست‌های خرید</Text><Text muted style={{ fontSize: 12, lineHeight: 22 }}>این‌ها پیش‌فاکتورهای هماهنگی مستقیم هستند؛ هیچ مبلغی در اپ پرداخت یا رزرو نمی‌شود.</Text></View>
    <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 16 }}>{([ ["Buyer", "درخواست‌های من"], ["Seller", "درخواست‌های دریافتی"] ] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: role === value }} onPress={() => setRole(value)} style={{ flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: "center", backgroundColor: role === value ? theme.green : theme.white, borderWidth: 1, borderColor: role === value ? theme.green : theme.border }}><Text bold style={{ color: role === value ? theme.white : theme.ink, fontSize: 12 }}>{label}</Text></Pressable>)}</View>
    <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{([ ["All", "همه"], ["Pending", "در حال بررسی"], ["Reviewed", "بررسی‌شده"] ] as const).map(([value, label]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={{ borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: filter === value ? theme.green : theme.white, borderWidth: 1, borderColor: filter === value ? theme.green : theme.border }}><Text bold style={{ color: filter === value ? theme.white : theme.ink, fontSize: 12 }}>{label}</Text></Pressable>)}</View>
    <QueryState loading={q.isLoading} error={q.error} empty={items.length === 0} emptyText={filter === "Pending" ? "درخواست در حال بررسی ندارید." : filter === "Reviewed" ? "درخواست بررسی‌شده‌ای ندارید." : role === "Buyer" ? "هنوز درخواست خریدی ثبت نکرده‌اید." : "درخواست خریدی برای آگهی‌هایتان ندارید."} retry={() => q.refetch()} />
    <View style={{ gap: 12 }}>{Array.from(farms, ([farmKey, group]) => (
      <Card key={farmKey} style={{ gap: 12 }}>
        <Text bold accessibilityRole="header" style={{ color: theme.green }}>{group[0].farmName}</Text>
        {group.map(item => (
          <View key={item.code} style={{ gap: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
              <InquiryThumbnail inquiry={item} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text bold>{item.productName}</Text>
                <Text bold style={{ fontSize: 11, color: item.status === "Declined" || item.status === "Cancelled" ? theme.danger : theme.green }}>
                  {statusLabel[item.status] || item.status}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: theme.mint, borderRadius: 12, padding: 12, gap: 5 }}>
              <Text style={{ fontSize: 12 }}>مقدار درخواستی: {number(item.quantity)} {saleUnitLabel(item.saleUnit)}</Text>
              <Text bold>برآورد آگهی: {money(item.estimatedTotal)}</Text>
            </View>
            {item.message ? <Text muted style={{ fontSize: 12 }}>پیام خریدار: {item.message}</Text> : null}
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
              <Button compact outline title="گفت‌وگو" icon={<Ionicons name="chatbubble-outline" size={16} color={theme.green} />} disabled={busy}
                onPress={() => run(async () => {
                  const room = await platformApi.getOrCreateConversation(role === "Buyer" ? item.sellerCode : item.buyerCode);
                  nav.navigate("ChatRoom", { code: room.code, title: item.productName });
                })} />
              {role === "Seller" && item.status === "Requested" ? <Button compact title="شروع هماهنگی" disabled={busy} onPress={() => act(item.code, "Contacted", "وضعیت درخواست به در حال هماهنگی تغییر کرد")} /> : null}
              {role === "Seller" && item.status === "Contacted" ? <Button compact title="ثبت توافق" disabled={busy} onPress={() => act(item.code, "Agreed", "توافق ثبت شد")} /> : null}
              {role === "Seller" && (item.status === "Requested" || item.status === "Contacted") ? <Button compact outline title="رد درخواست" disabled={busy} onPress={() => act(item.code, "Declined", "درخواست رد شد")} /> : null}
              {role === "Buyer" && (item.status === "Requested" || item.status === "Contacted") ? <Button compact outline title="لغو درخواست" disabled={busy} onPress={() => act(item.code, "Cancelled", "درخواست لغو شد")} /> : null}
            </View>
          </View>
        ))}
      </Card>
    ))}</View>
    {q.hasNextPage && <Button outline title="درخواست‌های بیشتر" busy={q.isFetchingNextPage} onPress={() => void q.fetchNextPage()} />}
  </Screen></AuthGate>;
}
