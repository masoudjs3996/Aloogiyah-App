import { saleUnitLabel } from "../../shared/utils/sale-units";
import React from "react";
import { View } from "react-native";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import { money, activeOffer, number } from "../../shared/utils/format";
import { useRoles } from "../../shared/hooks/useRoles";
import { useAuth } from "../../shared/providers/AuthProvider";
import type { ProductSummary } from "../../shared/types/mobile";

const WHOLESALE_ROLES = ["Buyer", "Farmer", "Admin", "Manager"];

export function ProductPrices({
  product,
  compact = false,
}: {
  product: ProductSummary;
  compact?: boolean;
}) {
  const { roles } = useRoles();
  const { signedIn } = useAuth();
  const showBothOnCard =
    compact &&
    signedIn &&
    roles.some((role) => WHOLESALE_ROLES.includes(role)) &&
    product.wholesalePrice != null;
  const wholesale =
    showBothOnCard ||
    (!compact &&
      roles.some((role) => role === "Buyer" || role === "Farmer") &&
      product.wholesalePrice != null);
  const active = activeOffer(product);
  const apply = (value: number, discounted?: number | null) =>
    active
      ? (discounted ??
        Math.round(
          value * (1 - (product.discountPercentage || 0) / 100) * 100,
        ) / 100)
      : value;
  const retail = apply(product.retailPrice, product.discountedRetailPrice);
  const partner =
    product.wholesalePrice == null
      ? null
      : apply(product.wholesalePrice, product.discountedWholesalePrice);
  return (
    <View style={{ gap: 6 }}>
      {product.saleUnit !== undefined && (
        <Text muted style={{ fontSize: 11 }}>
          قیمت برای هر {saleUnitLabel(product.saleUnit)}
        </Text>
      )}
      {!compact && (
        <Text muted style={{ fontSize: 12 }}>
          {wholesale ? "قیمت اصلی · همکاری" : "قیمت اصلی · خرده‌فروشی"}
        </Text>
      )}
      {active && (
        <Text
          muted
          style={{
            textDecorationLine: "line-through",
            fontSize: compact ? 11 : 13,
          }}
        >
          {money(wholesale ? product.wholesalePrice! : product.retailPrice)}
        </Text>
      )}
      <Text
        bold
        style={{
          color: theme.green,
          fontSize: compact ? 15 : 24,
          lineHeight: compact ? 26 : 38,
        }}
      >
        {money(wholesale ? partner! : retail)}
      </Text>
      {showBothOnCard && partner != null && (
        <View style={{ gap: 2 }}>
          <Text muted style={{ fontSize: 11 }}>
            عمده‌فروشی: {number(partner)}
          </Text>
          <Text muted style={{ fontSize: 11 }}>
            خرده‌فروشی: {number(retail)}
          </Text>
        </View>
      )}
      {!compact && (
        <View
          style={{
            gap: 4,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            paddingTop: 8,
          }}
        >
          <Text style={{ fontSize: compact ? 11 : 13 }}>
            قیمت همکاری: {partner == null ? "ثبت نشده" : money(partner)}
          </Text>
          <Text style={{ fontSize: compact ? 11 : 13 }}>
            قیمت خرده‌فروشی: {money(retail)}
          </Text>
        </View>
      )}
    </View>
  );
}
