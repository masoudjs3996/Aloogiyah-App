import { saleUnitLabel } from "../shared/utils/sale-units";
import { AppModal as Modal } from "../design-system/molecules/AppModal";
import { usePollingInterval } from "../shared/hooks/usePollingInterval";
import React, { useState } from "react";
import {
  View,
  StyleSheet,

  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../api/platform";
import { useAuth, useProfile } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { money, date, number } from "../shared/utils/format";
import {
  orderActionLabels,
  orderStatusLabel,
  paymentLabels,
  isStoppedOrder,
} from "../shared/order-statuses";
import { theme } from "../shared/theme";
import { Screen } from "../design-system/templates/Screen";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { Field } from "../design-system/atoms/Field";
import { QueryState } from "../design-system/molecules/QueryState";
import { OrderProgress } from "../design-system/molecules/OrderProgress";
import type { Props } from "../navigation/types";

import { DeliveryPanel } from "../design-system/organisms/DeliveryPanels";
function CardDeliveryNotice() { return <Text>حمل مزرعه تا میدان با کشاورز است؛ درآمد پس از ثبت کد تحویل خریدار آزاد می‌شود.</Text>; }
function Heading({
  icon,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.row, { marginBottom: 16 }]}>
      <Ionicons name={icon} size={21} color={theme.green} />
      <Text bold style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}
function Amount({
  label,
  value,
  total = false,
}: {
  label: string;
  value: number;
  total?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        { justifyContent: "space-between", paddingVertical: 6 },
        total && styles.total,
      ]}
    >
      <Text bold={total} muted={!total} style={{ fontSize: 12 }}>
        {label}
      </Text>
      <Text
        bold={total}
        style={{ fontSize: 12, color: total ? "#065F46" : theme.muted }}
      >
        {money(value)}
      </Text>
    </View>
  );
}
export function OrderScreen({ route, navigation }: Props<"Order">) {
  const code = route.params.code;
  const signedIn = useAuth().signedIn;
  const userCode = useProfile().data?.user?.code;
  const q = useQuery({
    queryKey: ["order", code],
    queryFn: () => platformApi.order(code),
    enabled: signedIn,
    refetchInterval: usePollingInterval(15000),
  });
  const o = q.data;
  const [action, setAction] = useState("");
  const [reason, setReason] = useState("");
  const [shipping, setShipping] = useState("");
  const [tracking, setTracking] = useState("");
  const { busy, run } = useAction();
  const actions =
    o?.allowedActions.filter((a) =>
      ["Approve", "Reject", "Ship"].includes(a) &&
          o.sellerCode === userCode,
    ) ?? [];
  const openAction = (value: string) => {
    setReason("");
    setShipping("");
    setTracking("");
    setAction(value);
  };
  return (
    <AuthGate>
      <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
        <Button
          compact
          outline
          title="بازگشت به سفارش‌ها"
          onPress={() => navigation.navigate("Orders")}
          style={{ alignSelf: "flex-end", marginBottom: 20 }}
        />
        <QueryState
          loading={q.isLoading}
          error={q.error}
          retry={() => q.refetch()}
        />
        {o && (
          <>
            <View
              style={[
                styles.section,
                { padding: 0, overflow: "hidden", borderColor: "#D1FAE5" },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.row}>
                  <View style={styles.store}>
                    <Ionicons
                      name="storefront-outline"
                      size={24}
                      color="white"
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: theme.green, fontSize: 11 }}>
                      جزئیات سفارش
                    </Text>
                    <Text bold style={{ fontSize: 20, lineHeight: 32 }}>
                      {o.farmName}
                    </Text>
                  </View>
                </View>
                <Text
                  bold
                  style={[
                    styles.status,
                    {
                      color: isStoppedOrder(o.statusCode, o.statusTitle)
                        ? theme.danger
                        : o.isPaid
                          ? theme.green
                          : "#B45309",
                      backgroundColor: isStoppedOrder(
                        o.statusCode,
                        o.statusTitle,
                      )
                        ? "#FEF2F2"
                        : o.isPaid
                          ? "#D1FAE5"
                          : "#FEF3C7",
                    },
                  ]}
                >
                  {orderStatusLabel(o.statusCode, o.statusTitle)}
                </Text>
                <View style={[styles.row, { flexWrap: "wrap" }]}>
                  <Text style={styles.chip}>{o.code}</Text>
                  <View style={[styles.row, styles.chip]}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={theme.muted}
                    />
                    <Text style={styles.small}>{date(o.createdAt)}</Text>
                  </View>
                  <View style={[styles.row, styles.chip]}>
                    <Ionicons
                      name="card-outline"
                      size={15}
                      color={theme.muted}
                    />
                    <Text style={styles.small}>
                      {paymentLabels[o.paymentStatus] ||
                        o.paymentStatus ||
                        (o.isPaid ? "پرداخت شده" : "در انتظار پرداخت")}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ padding: 20 }}>
                <Heading icon="bag-outline">
                  اقلام سفارش · {number(o.orderItems.length)} قلم
                </Heading>
                <View style={styles.items}>
                  {o.orderItems.map((item, index) => (
                    <View
                      key={item.code}
                      style={{
                        paddingVertical: 16,
                        gap: 10,
                        borderTopWidth: index ? 1 : 0,
                        borderColor: "#F1F5F9",
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`مشاهده محصول ${item.productName}`}
                        onPress={() =>
                          navigation.navigate("Product", {
                            code: item.agriculturalProductCode,
                          })
                        }
                      >
                        <Text bold style={{ fontSize: 13 }}>
                          {item.productName}
                        </Text>
                      </Pressable>
                      <Button
                        compact
                        outline
                        title="گزارش / درخواست کیفیت"
                        onPress={() =>
                          navigation.navigate("QualityForm", {
                            productCode: item.agriculturalProductCode,
                          })
                        }
                        style={{
                          alignSelf: "flex-end",
                          backgroundColor: "#ECFDF5",
                          borderColor: "#D1FAE5",
                        }}
                      />
                      <View
                        style={[
                          styles.row,
                          { flexWrap: "wrap", justifyContent: "space-between" },
                        ]}
                      >
                        <Text muted style={styles.small}>
                          {number(item.quantity)} {saleUnitLabel(item.saleUnit)} × {money(item.price)}
                        </Text>
                        <Text bold style={{ fontSize: 12 }}>
                          {money(item.lineTotal)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.summary}>
                  <Text bold style={{ marginBottom: 12 }}>
                    خلاصه مبلغ
                  </Text>
                  <Amount label="جمع کالاها" value={o.subtotal} />
                  <Amount label="ارسال" value={o.shippingAmount} />
                  <Amount label="تخفیف" value={o.discountAmount} />
                  <Amount label="مبلغ نهایی" value={o.totalPrice} total />
                </View>
              </View>
            </View>
            {o.address && (
              <View style={styles.section}>
                <Heading icon="location-outline">اطلاعات تحویل</Heading>
                <View style={styles.info}>
                  <Text muted style={styles.small}>
                    تحویل‌گیرنده
                  </Text>
                  <Text bold>{o.address.recipient}</Text>
                  <Text style={{ writingDirection: "ltr", textAlign: "right" }}>
                    {o.address.phoneNumber}
                  </Text>
                </View>
                <View style={[styles.info, { marginTop: 16 }]}>
                  <Text muted style={styles.small}>
                    نشانی
                  </Text>
                  <Text>
                    {[o.address.province, o.address.county, o.address.street]
                      .filter(Boolean)
                      .join("، ")}
                  </Text>
                  <Text muted style={styles.small}>
                    کد پستی: {o.address.postalCode}
                  </Text>
                </View>
                {!!o.trackingCode && (
                  <View style={[styles.row, styles.tracking]}>
                    <Ionicons
                      name="car-outline"
                      size={21}
                      color={theme.green}
                    />
                    <Text bold style={{ flex: 1, fontSize: 12 }}>
                      کد رهگیری: {o.trackingCode}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.section}>
              <Heading icon="time-outline">پیگیری سفارش</Heading>
              <OrderProgress
                orderItems={o.orderItems}
                statusCode={o.statusCode}
                statusTitle={o.statusTitle}
                history={o.history}
              />
              {!!o.rejectionReason && (
                <Text
                  style={{
                    backgroundColor: "#FEF2F2",
                    color: theme.danger,
                    padding: 12,
                    marginTop: 16,
                    borderRadius: 12,
                  }}
                >
                  دلیل رد: {o.rejectionReason}
                </Text>
              )}
              {!!o.refundStatus && o.refundStatus !== "None" && (
                <Text muted style={{ marginTop: 16, fontSize: 12 }}>
                  وضعیت بازپرداخت: {o.refundStatus} / {money(o.refundAmount)}
                </Text>
              )}
              <View style={{ marginTop: 16, gap: 10 }}>
                {actions.map((a) => (
                  <Button
                    key={a}
                    title={orderActionLabels[a] || a}
                    outline={a === "Reject"}
                    onPress={() => openAction(a)}
                  />
                ))}
                {!o.isPaid &&
                  !o.isHeld &&
                  o.checkoutCode &&
                  o.statusCode === "3EFC703625" && (
                    <Button
                      title="ادامه پرداخت"
                      onPress={() =>
                        navigation.navigate("Checkout", {
                          code: o.checkoutCode!,
                        })
                      }
                    />
                  )}
              </View>
              <View style={{ marginTop: 16, gap: 12 }}>
                {o.history?.map((h, index) => (
                  <View
                    key={`${h.createdAt}-${index}`}
                    style={{
                      borderRightWidth: 2,
                      borderColor: "#A7F3D0",
                      paddingRight: 16,
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>
                      {orderActionLabels[h.action] || h.action}
                      {h.reason ? ` · ${h.reason}` : ""}
                    </Text>
                    <Text muted style={{ fontSize: 10 }}>
                      {date(h.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
        {o?.buyerCode === userCode && <DeliveryPanel checkoutCode={o?.checkoutCode || undefined} />}
        {o?.sellerCode === userCode && <CardDeliveryNotice />}
      </Screen>
      <Modal
        visible={!!action}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setAction("");
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="بستن عملیات سفارش"
            disabled={busy}
            onPress={() => setAction("")}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={styles.sheet}>
            <View
              style={[
                styles.row,
                { justifyContent: "space-between", marginBottom: 16 },
              ]}
            >
              <Text bold>{orderActionLabels[action] || "عملیات سفارش"}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بستن فرم سفارش"
                disabled={busy}
                onPress={() => setAction("")}
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={24} color={theme.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text muted style={{ marginBottom: 20 }}>
                این عملیات روی سفارش ثبت شود؟
              </Text>
              {action === "Reject" && (
                <Field
                  label="دلیل رد سفارش"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  maxLength={1000}
                />
              )}
              {action === "Ship" && (
                <>
                  <Field
                    label="روش ارسال"
                    value={shipping}
                    onChangeText={setShipping}
                    maxLength={100}
                  />
                  <Field
                    label="کد رهگیری (اختیاری)"
                    value={tracking}
                    onChangeText={setTracking}
                    maxLength={100}
                  />
                </>
              )}
              <Button
                title="تأیید و ثبت"
                busy={busy}
                disabled={
                  action === "Reject"
                    ? !reason.trim()
                    : action === "Ship"
                      ? !shipping.trim()
                      : !action
                }
                onPress={() =>
                  run(async () => {
                    await platformApi.orderAction(code, {
                      action,
                      reason: reason.trim() || undefined,
                      shippingMethod: shipping.trim() || undefined,
                      trackingCode: tracking.trim() || undefined,
                    });
                    setAction("");
                  })
                }
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AuthGate>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  section: {
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 20,
    marginBottom: 20,
  },
  header: {
    backgroundColor: "#ECFDF5",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#D1FAE5",
    gap: 16,
  },
  store: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    alignSelf: "flex-end",
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 11,
  },
  chip: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: theme.muted,
  },
  small: { fontSize: 11, lineHeight: 22 },
  items: {
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  summary: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  total: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    flexWrap: "wrap",
  },
  info: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  tracking: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: "85%",
    width: "100%",
    maxWidth: 768,
    alignSelf: "center",
  },
});
