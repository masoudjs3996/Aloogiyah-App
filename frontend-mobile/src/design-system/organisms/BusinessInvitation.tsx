import React from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import type { BusinessType } from "../../shared/types/business";

export function BusinessInvitation({ onJoin }: { onJoin: (type: BusinessType) => void }) {
  return (
    <View style={{ marginTop: 20, gap: 10 }}>
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        <Text bold style={{ color: "#0F172A", fontSize: 16, lineHeight: 27 }}>از مزرعه تا مغازه، همراه هم</Text>
        <Text style={{ color: "#64748B", fontSize: 10 }}>یک قدم تا شروع همکاری</Text>
      </View>
      {([
        { type: "Farmer", icon: "sunny-outline", title: "کشاورز یا تولیدکننده‌اید؟", description: "محصولاتتان را مستقیم معرفی کنید، منصفانه بفروشید و با خریداران واقعی ارتباط بگیرید.", action: "شروع همکاری به‌عنوان تولیدکننده", bg: "#F0FAF5", border: "#D1FAE5", iconBg: "#D1FAE5", ink: "#065F46" },
        { type: "Shop", icon: "storefront-outline", title: "برای مغازه‌تان خرید می‌کنید؟", description: "محصولات باکیفیت را مستقیم از تولیدکننده پیدا کنید؛ با قیمت شفاف و انتخابی مطمئن.", action: "شروع همکاری به‌عنوان خریدار", bg: "#FFF7ED", border: "#FED7AA", iconBg: "#FED7AA", ink: "#C2410C" },
      ] as const).map(item => (
        <View key={item.type} style={{ padding: 14, borderRadius: 16, backgroundColor: item.bg, borderWidth: 1, borderColor: item.border, gap: 10 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: item.iconBg }}><Ionicons name={item.icon} size={23} color={item.ink} /></View>
            <View style={{ flex: 1, gap: 3 }}><Text bold style={{ color: "#0F172A", fontSize: 13, lineHeight: 23 }}>{item.title}</Text><Text style={{ color: "#475569", fontSize: 11, lineHeight: 21 }}>{item.description}</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={item.action} onPress={() => onJoin(item.type)} style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: "white", opacity: pressed ? 0.7 : 1 })}>
            <Text bold style={{ color: item.ink, fontSize: 12 }}>{item.action}</Text><Ionicons name="arrow-back" size={17} color={item.ink} />
          </Pressable>
        </View>
      ))}
      <Text style={{ color: "#64748B", fontSize: 10, lineHeight: 20 }}>فعال‌سازی حساب همکاری پس از بررسی مدیریت</Text>
    </View>
  );
}
