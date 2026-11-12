import { appAlert as Alert } from "../shared/alerts";
import React, { useEffect, useState } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/mobile";
import { Screen } from "../design-system/templates/Screen";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { Card } from "../design-system/atoms/Card";
import { Text } from "../design-system/atoms/Text";
import { QueryState } from "../design-system/molecules/QueryState";
import { useAuth } from "../shared/providers/AuthProvider";
import { date, money, number } from "../shared/utils/format";
import { theme } from "../shared/theme";
import type { CategoryOption, Reward } from "../shared/types/platform";
import {
  categoryColors,
  matchesRewardCategory,
  rewardAvailability,
  rewardCategoryNames,
  rewardPalette,
  rewardPalettes,
} from "../shared/utils/rewards";

function ColorStrip({
  colors = categoryColors,
}: {
  colors?: readonly string[];
}) {
  return (
    <View
      accessible={false}
      style={{ flexDirection: "row-reverse", height: 4 }}
    >
      {colors.map((color, i) => (
        <View
          key={`${color}-${i}`}
          style={{ flex: 1, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

function RewardCard({
  reward,
  categories,
  now,
}: {
  reward: Reward;
  categories: CategoryOption[];
  now: number;
}) {
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  const names = rewardCategoryNames(reward, categories);
  const palette =
    names.length === 1 ? rewardPalette(names[0]) : rewardPalettes.all;
  const colors = names.length
    ? [...new Set(names.map((name) => rewardPalette(name).color))]
    : categoryColors;
  const availability = rewardAvailability(reward, now);
  const validity = availability.expired
    ? "مهلت استفاده تمام شده"
    : availability.upcoming
      ? `قابل استفاده از ${date(reward.startDate ?? undefined)}`
      : availability.daysLeft == null
        ? "بدون محدودیت زمانی"
        : `قابل استفاده تا ${number(availability.daysLeft)} روز دیگر`;
  const usage =
    availability.remainingUsage == null
      ? "بدون محدودیت دفعات"
      : `${number(availability.remainingUsage)} بار استفاده باقی‌مانده`;
  return (
    <Card style={[styles.coupon, { borderColor: palette.border }]}>
      <ColorStrip colors={colors} />
      <View style={styles.couponBody}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: palette.soft }]}>
            <Ionicons name={palette.icon} size={24} color={palette.color} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text bold style={{ fontSize: 14, lineHeight: 26 }}>
              {reward.description || "تخفیف ویژه شما"}
            </Text>
            <Text style={{ color: palette.color, fontSize: 11 }}>
              {names.join("، ") || "همه دسته‌ها"}
            </Text>
          </View>
        </View>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text
            bold
            style={{ color: palette.color, fontSize: 19, lineHeight: 30 }}
          >
            {reward.discountType === 0 || reward.discountType === "Percentage"
              ? `${number(reward.value)}٪ تخفیف`
              : `${money(reward.value)} تخفیف`}
          </Text>
          {!reward.isActive && (
            <Text muted style={styles.badge}>
              غیرفعال
            </Text>
          )}
        </View>
        <View style={[styles.row, { flexWrap: "wrap", gap: 6 }]}>
          <Text
            style={[
              styles.badge,
              availability.expired && {
                color: "#B91C1C",
                backgroundColor: "#FEF2F2",
              },
            ]}
          >
            {validity}
          </Text>
          <Text style={styles.badge}>{usage}</Text>
        </View>
        <View
          style={[
            styles.codeBar,
            { backgroundColor: palette.soft, borderColor: palette.border },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text muted style={{ fontSize: 10 }}>
              کد تخفیف
            </Text>
            <Text
              selectable
              bold
              style={{
                fontSize: 17,
                writingDirection: "ltr",
                textAlign: "right",
                color: palette.color,
              }}
            >
              {reward.code}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`کپی کد تخفیف ${reward.code}`}
            disabled={copying}
            onPress={async () => {
              setCopying(true);
              try {
                const success = await Clipboard.setStringAsync(reward.code);
                if (!success) throw new Error("copy failed");
                setCopied(true);
              } catch {
                Alert.alert(
                  "کپی انجام نشد",
                  "کد را لمس و نگه دارید و گزینه کپی را انتخاب کنید.",
                  undefined,
                  { tone: "error" },
                );
              } finally {
                setCopying(false);
              }
            }}
            style={({ pressed }) => [
              styles.copyButton,
              {
                borderColor: palette.border,
                opacity: pressed || copying ? 0.6 : 1,
              },
            ]}
          >
            <Ionicons
              name={copied ? "checkmark-outline" : "copy-outline"}
              size={18}
              color={palette.color}
            />
            <Text
              bold
              accessibilityLiveRegion="polite"
              style={{ color: palette.color, fontSize: 12 }}
            >
              {copied ? "کپی شد" : "کپی کد"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

export function RewardsScreen() {
  const { signedIn } = useAuth();
  const [active, setActive] = useState("");
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const rewards = useQuery({
    queryKey: ["rewards"],
    queryFn: ({ signal }) => api.rewards(signal),
    enabled: signedIn,
  });
  const categories = useQuery({
    queryKey: ["categories", "home"],
    queryFn: api.homeCategories,
    enabled: signedIn,
  });
  const items =
    rewards.data?.items.filter((reward) =>
      matchesRewardCategory(reward, active),
    ) ?? [];
  const filters = [{ code: "", name: "همه" }, ...(categories.data ?? [])];
  const refresh = () => {
    void rewards.refetch();
    void categories.refetch();
    setNow(Date.now());
  };
  return (
    <AuthGate>
      <Screen
        title="تخفیف و جایزه شما"
        onRefresh={refresh}
        refreshing={rewards.isRefetching || categories.isRefetching}
      >
        <QueryState
          loading={categories.isLoading}
          error={categories.error}
          retry={() => categories.refetch()}
        />
        <View style={styles.filters}>
          {filters.map((category) => {
            const selected = active === category.code;
            return (
              <Pressable
                key={category.code}
                accessibilityRole="button"
                accessibilityLabel={category.name}
                accessibilityState={{ selected }}
                onPress={() => setActive(category.code)}
                style={({ pressed }) => [
                  styles.filter,
                  {
                    backgroundColor: "white",
                    borderColor: selected ? theme.ink : theme.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  bold={selected}
                  style={{
                    fontSize: 12,
                    color: selected ? theme.ink : theme.muted,
                  }}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <QueryState
          loading={rewards.isLoading}
          error={rewards.error}
          retry={() => rewards.refetch()}
        />
        {!rewards.isLoading && !rewards.error && !items.length && (
          <Card style={styles.empty}>
            <Ionicons name="ticket-outline" size={38} color={theme.muted} />
            <Text bold>
              {active
                ? "در این دسته تخفیفی موجود نیست"
                : "هنوز تخفیفی برای شما ثبت نشده"}
            </Text>
            <Text muted style={{ textAlign: "center", fontSize: 12 }}>
              کدهای تخفیف جدید در این بخش نمایش داده می‌شوند.
            </Text>
          </Card>
        )}
        {items.map((reward) => (
          <RewardCard
            key={reward.code}
            reward={reward}
            categories={categories.data ?? []}
            now={now}
          />
        ))}
      </Screen>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  filters: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  filter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  coupon: {
    padding: 0,
    overflow: "hidden",
    gap: 0,
    borderRadius: 16,
    marginBottom: 16,
  },
  couponBody: { padding: 16, gap: 14 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    fontSize: 10,
    lineHeight: 22,
    color: "#475569",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: "hidden",
  },
  codeBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 10,
  },
  copyButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "white",
  },
  empty: { alignItems: "center", paddingVertical: 32 },
});
