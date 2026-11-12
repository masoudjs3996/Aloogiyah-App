import React, { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "../atoms/Card";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import { imageUrl } from "../../shared/utils/format";
import type { Profile } from "../../shared/types/mobile";

export function ProfileSummary({
  user,
  onEditPhoto,
  busy,
}: {
  user: NonNullable<Profile["user"]>;
  onEditPhoto: () => void;
  busy: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const photo = imageUrl(user.profileImageUrl);
  useEffect(() => setFailed(false), [photo]);
  const role =
    (
      {
        Manager: "مدیر ارشد",
        Admin: "ادمین",
        User: "کاربر",
        Buyer: "خریدار",
        Farmer: "کشاورز",
        Expert: "کارشناس",
        Provider: "ارائه‌دهنده خدمات",
      } as Record<string, string>
    )[user.roleName] ||
    user.roleName ||
    "کاربر";
  const stats = [
    {
      label: "عضویت از",
      value:
        user.createdAt && Number.isFinite(Date.parse(user.createdAt))
          ? new Date(user.createdAt).toLocaleDateString("fa-IR-u-ca-persian", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "نامشخص",
      icon: "calendar-outline" as const,
    },
    {
      label: "نام کاربری",
      value: user.userName || "ثبت نشده",
      icon: "leaf-outline" as const,
    },
    {
      label: "نقش کاربری",
      value: role,
      icon: "shield-checkmark-outline" as const,
    },
  ];
  return (
    <Card
      style={{
        padding: 0,
        gap: 0,
        overflow: "hidden",
        borderRadius: 16,
        marginBottom: 24,
        marginHorizontal: 16,
      }}
    >
      <View
        accessible={false}
        style={{ width: "100%", height: 120, backgroundColor: theme.green }}
      />
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="ویرایش عکس پروفایل"
          onPress={onEditPhoto}
          style={{
            alignSelf: "flex-end",
            marginTop: -48,
            alignItems: "center",
            gap: 6,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: theme.mint,
              borderWidth: 4,
              borderColor: "white",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photo && !failed ? (
              <Image
                source={{ uri: photo }}
                onError={() => setFailed(true)}
                style={{ width: 88, height: 88, borderRadius: 44 }}
              />
            ) : (
              <Ionicons name="leaf-outline" size={50} color={theme.green} />
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                borderRadius: 14,
                backgroundColor: theme.green,
                padding: 6,
              }}
            >
              <Ionicons name="pencil-outline" size={15} color="white" />
            </View>
          </View>
          <Text muted style={{ fontSize: 12 }}>
            ویرایش عکس پروفایل
          </Text>
        </Pressable>
        <Text bold style={{ marginTop: 16, fontSize: 21, lineHeight: 32 }}>
          {user.fName || "نام ثبت نشده"}
        </Text>
        <Text style={{ color: theme.green }}>{role}</Text>
        <View
          style={{
            flexDirection: "row-reverse",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 12,
          }}
        >
          <Text muted style={{ fontSize: 12 }}>
            {user.email || "ایمیل ثبت نشده"}
          </Text>
          <Text muted style={{ fontSize: 12 }}>
            {user.phoneNumber || "شماره همراه ثبت نشده"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row-reverse",
            borderTopWidth: 1,
            borderColor: "#F1F5F9",
            paddingTop: 18,
            marginTop: 20,
            gap: 8,
          }}
        >
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={{ flex: 1, alignItems: "center", gap: 5 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F0FDF4",
                  borderRadius: 12,
                }}
              >
                <Ionicons name={stat.icon} size={23} color={theme.green} />
              </View>
              <Text muted style={{ fontSize: 10, textAlign: "center" }}>
                {stat.label}
              </Text>
              <Text
                style={{ fontSize: 11, lineHeight: 21, textAlign: "center" }}
              >
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
