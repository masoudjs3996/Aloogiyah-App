import { saleUnitLabel } from "../../shared/utils/sale-units";
import React, { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import { imageUrl, money, number } from "../../shared/utils/format";
import type { CartItem } from "../../shared/types/platform";

export function CartItemRow({
  item,
  busy,
  onOpen,
  onChange,
  onRemove,
}: {
  item: CartItem;
  busy: boolean;
  onOpen: () => void;
  onChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const uri = imageUrl(item.primaryImageUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const controls = [
    {
      icon: "add" as const,
      label: "افزایش تعداد",
      disabled: busy || item.quantity >= item.availableStock,
      action: () => onChange(item.quantity + 1),
    },
    {
      icon: "remove" as const,
      label: "کاهش تعداد",
      disabled: busy || item.quantity <= 1,
      action: () => onChange(item.quantity - 1),
    },
    {
      icon: "trash-outline" as const,
      label: "حذف از سبد",
      disabled: busy,
      action: onRemove,
    },
  ];
  return (
    <View
      style={{
        paddingVertical: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View
        style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}
      >
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`مشاهده ${item.productName}`}
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: theme.mint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {uri && !failed ? (
            <Image
              source={{ uri }}
              resizeMode="cover"
              style={{ width: 64, height: 64 }}
              onError={() => setFailed(true)}
            />
          ) : (
            <Ionicons name="leaf-outline" size={28} color={theme.green} />
          )}
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Pressable
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel={`مشاهده ${item.productName}`}
          >
            <Text bold style={{ fontSize: 13 }}>
              {item.productName}
            </Text>
          </Pressable>
          <Text muted style={{ fontSize: 11 }}>
            قیمت واحد: {money(item.unitPrice)}
          </Text>
          <Text muted style={{ fontSize: 11 }}>
            موجودی: {number(item.availableStock)}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <View
          style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}
        >
          {controls.map((control, index) => (
            <React.Fragment key={control.icon}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${control.label} ${item.productName}`}
                accessibilityState={{ disabled: control.disabled }}
                disabled={control.disabled}
                onPress={control.action}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: index === 2 ? "#FEF2F2" : theme.bg,
                  opacity: control.disabled ? 0.4 : pressed ? 0.7 : 1,
                })}
              >
                <Ionicons
                  name={control.icon}
                  size={18}
                  color={index === 2 ? theme.danger : theme.green}
                />
              </Pressable>
              {index === 0 && (
                <Text bold style={{ minWidth: 24, textAlign: "center" }}>
                  {number(item.quantity)} {saleUnitLabel(item.saleUnit)}
                </Text>
              )}
            </React.Fragment>
          ))}
        </View>
        <Text bold style={{ fontSize: 12, color: theme.green }}>
          {money(item.totalPrice)}
        </Text>
      </View>
    </View>
  );
}
