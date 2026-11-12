import { saleUnitLabel } from "../shared/utils/sale-units";
import { AppModal as Modal } from "../design-system/molecules/AppModal";
import { usePollingInterval } from "../shared/hooks/usePollingInterval";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Props } from "../navigation/types";
import type {
  Checkout,
  CheckoutDiscountPreview,
} from "../shared/types/platform";
import { platformApi } from "../api/platform";
import { useAuth } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { attemptKey, completeAttempt } from "../shared/utils/attempt";
import { money, number } from "../shared/utils/format";
import { theme } from "../shared/theme";
import { Screen } from "../design-system/templates/Screen";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { Select } from "../design-system/molecules/Select";
import { QueryState } from "../design-system/molecules/QueryState";

import { DeliveryChoice, DeliveryPanel } from "../design-system/organisms/DeliveryPanels";
import type { DeliverySelection } from "../shared/types/delivery";
const panel = { padding: 24, borderRadius: 24, gap: 24 };
const reserveDescription = "وجه تا تأیید فروشنده در کیف پول رزرو می‌شود.";
const successDescription =
  "درخواست خرید ثبت شده است. وجه سفارش‌های در انتظار تأیید، رزرو است و پس از تأیید فروشنده برداشت می‌شود؛ در صورت رد، رزرو آزاد می‌شود. وضعیت هر مزرعه را در سفارش‌ها پیگیری کنید.";

function AmountRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text bold={strong} style={{ fontSize: 13, flexShrink: 1 }}>
        {label}
      </Text>
      <Text
        bold={strong}
        style={{ fontSize: 13, color: strong ? "#065F46" : theme.ink }}
      >
        {money(value)}
      </Text>
    </View>
  );
}

export function CheckoutDetailsScreen({
  navigation,
}: Props<"CheckoutDetails">) {
  const { signedIn } = useAuth();
  const cart = useQuery({
    queryKey: ["cart", signedIn],
    queryFn: platformApi.cart,
    enabled: signedIn,
  });
  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: () => platformApi.addresses({ PageSize: 100 }),
    enabled: signedIn,
  });
  const [delivery, setDelivery] = useState<DeliverySelection>();
  const [address, setAddress] = useState("");
  const knownAddresses = useRef<string[] | undefined>(undefined);
  useEffect(() => {
    if (!addresses.data) return;
    const codes = addresses.data.items.map((item) => item.code);
    const added =
      knownAddresses.current &&
      codes.find((code) => !knownAddresses.current!.includes(code));
    if (added) setAddress(added);
    knownAddresses.current = codes;
  }, [addresses.data]);
  const [discount, setDiscount] = useState("");
  const [preview, setPreview] = useState<{
    fingerprint: string;
    result: CheckoutDiscountPreview;
  }>();
  const lock = useRef(false);
  const { busy, run } = useAction();
  const c = cart.data;
  const fingerprint = JSON.stringify([
    c?.cartId,
    discount.trim(),
    c?.totalPrice,
    c?.farms.flatMap((farm) =>
      farm.items.map((item) => [item.code, item.quantity, item.unitPrice, item.saleUnit]),
    ),
  ]);
  const validPreview =
    preview?.fingerprint === fingerprint ? preview.result : undefined;
  const items = addresses.data?.items ?? [];
  const selectedAddress = items.some((item) => item.code === address)
    ? address
    : (items.find((item) => item.isDefault) || items[0])?.code;
  const deliveryAddress = items.find(item => item.code === selectedAddress);
  const create = () =>
    run(async () => {
      if (lock.current || !c?.itemCount) return;
      if (!selectedAddress) throw new Error("آدرس تحویل را انتخاب کنید");
      if (!delivery || delivery.fingerprint !== JSON.stringify([c, selectedAddress])) throw new Error("روش دریافت و هزینه را تأیید کنید.");
      if (discount.trim() && !validPreview)
        throw new Error("ابتدا کد تخفیف را اعمال کنید.");
      lock.current = true;
      try {
        const key = await attemptKey(
          "checkout",
          JSON.stringify([
            c.cartId,
            selectedAddress,
            delivery.code,
            discount.trim(),
            c.farms.flatMap((farm) =>
              farm.items.map((item) => [item.code, item.quantity]),
            ),
          ]),
        );
        const result = await platformApi.createCheckout({
          cartId: c.cartId,
          addressCode: selectedAddress,
          deliveryBookingCode: delivery.code,
          expectedDeliveryFee: delivery.fee,
                  expectedDeferredDeliveryFeeLimit: delivery.deferredFeeLimit,
          discountCode: discount.trim() || undefined,
          idempotencyKey: key,
        });
        await completeAttempt("checkout");
        navigation.navigate("Checkout", { code: result.code });
      } finally {
        lock.current = false;
      }
    });
  return (
    <AuthGate>
      <Screen
        title="انتخاب آدرس و ثبت خرید"
        fixedFooter={
          c?.itemCount ? (
            <View
              style={{
                padding: 12,
                backgroundColor: "white",
                borderTopWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Button
                title="ثبت خرید و مشاهده مبلغ نهایی"
                busy={busy}
                disabled={
                  !selectedAddress || !delivery ||
                  !!addresses.error ||
                  (!!discount.trim() && !validPreview)
                }
                onPress={() => void create()}
              />
            </View>
          ) : undefined
        }
      >
        <Text muted style={{ fontSize: 13, lineHeight: 27, marginBottom: 24 }}>
          {reserveDescription}
        </Text>
        <QueryState
          loading={cart.isLoading || addresses.isLoading}
          error={cart.error || addresses.error}
          retry={() => {
            void cart.refetch();
            void addresses.refetch();
          }}
        />
        {!cart.isLoading && !cart.error && c?.itemCount === 0 && (
          <Card>
            <Text>سبد خرید شما خالی است.</Text>
            <Button
              title="مشاهده محصولات"
              onPress={() => navigation.navigate("Products")}
            />
          </Card>
        )}
        {!!c?.itemCount && (
          <Card style={panel}>
            <DeliveryChoice key={JSON.stringify([deliveryAddress, c])} countyCode={deliveryAddress?.countyCode} cartId={c?.cartId} addressCode={selectedAddress} fingerprint={JSON.stringify([c, selectedAddress])} onSelect={setDelivery} />
            <Select
              label="آدرس تحویل"
              value={selectedAddress}
              onChange={setAddress}
              disabled={busy}
              options={items.map((item) => ({
                value: item.code,
                label: [
                  item.provinceName,
                  item.cityName || item.countyName,
                  item.street,
                ]
                  .filter(Boolean)
                  .join("، "),
              }))}
            />
            {!items.length && !addresses.isLoading && (
              <Text muted style={{ fontSize: 13 }}>
                برای ارسال سفارش، نشانی خود را اضافه کنید.
              </Text>
            )}
            <Button
              outline
              title="افزودن نشانی جدید"
              style={{ alignSelf: "flex-end" }}
              disabled={busy}
              onPress={() => navigation.navigate("AddressForm")}
            />
            <View
              style={{
                padding: 16,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 16,
                gap: 12,
              }}
            >
              <Field
                label="کد تخفیف (اختیاری)"
                value={discount}
                editable={!busy}
                maxLength={100}
                autoCapitalize="none"
                style={{ textAlign: "left", writingDirection: "ltr" }}
                onChangeText={(value) => {
                  setDiscount(value);
                  setPreview(undefined);
                }}
              />
              <Button
                title="اعمال تخفیف"
                busy={busy}
                disabled={!discount.trim()}
                onPress={() =>
                  void run(async () => {
                    setPreview(undefined);
                    const result = await platformApi.previewCheckoutDiscount({
                      cartId: c.cartId,
                      discountCode: discount.trim(),
                    });
                    setPreview({ fingerprint, result });
                  })
                }
              />
              {validPreview && (
                <Text style={{ fontSize: 13, color: "#047857" }}>
                  کد تخفیف اعمال شد؛ {money(validPreview.discountAmount)} تخفیف.
                </Text>
              )}
              {!!discount.trim() && !validPreview && !busy && (
                <Text muted style={{ fontSize: 12 }}>
                  برای بررسی کد، «اعمال تخفیف» را بزنید.
                </Text>
              )}
            </View>
            <View
              style={{
                backgroundColor: theme.mint,
                padding: 16,
                borderRadius: 12,
                gap: 14,
              }}
            >
              <AmountRow
                label="جمع کالاهای سبد"
                value={validPreview?.subtotal ?? c.totalPrice}
                strong
              />
              {validPreview && (
                <>
                  <AmountRow
                    label="تخفیف"
                    value={validPreview.discountAmount}
                  />
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderColor: "#A7F3D0",
                      paddingTop: 12,
                    }}
                  >
                    <AmountRow
                      label="مبلغ پس از تخفیف"
                      value={validPreview.payableAmount}
                      strong
                    />
                  </View>
                </>
              )}
            </View>
          </Card>
        )}
      </Screen>
    </AuthGate>
  );
}

export function CheckoutScreen({ route, navigation }: Props<"Checkout">) {
  const code = route.params.code;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["checkout", code],
    queryFn: () => platformApi.checkout(code),
    enabled: useAuth().signedIn,
    refetchInterval: usePollingInterval(15000),
  });
  const [confirmed, setConfirmed] = useState<Checkout>();
  const [dialog, setDialog] = useState<"pay" | "cancel" | null>(null);
  const [dialogContent, setDialogContent] = useState<"pay" | "cancel">("pay");
  const openDialog = (kind: "pay" | "cancel") => {
    setDialogContent(kind);
    setDialog(kind);
  };
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const { busy, run } = useAction();
  const c =
    query.data?.isSubmitted || query.data?.isPaid
      ? query.data
      : confirmed || query.data;
  const submitted = !!(c?.isSubmitted || c?.isPaid);
  const expired = !!c && (c.isExpired || now >= Date.parse(c.expiresAt));
  const confirm = () =>
    run(async () => {
      if (dialog === "pay") {
        const result = await platformApi.payWallet(code);
        client.setQueryData(["checkout", code], result);
        setConfirmed(result);
      } else if (dialog === "cancel") {
        await platformApi.cancelCheckout(code);
        client.setQueryData<Checkout>(["checkout", code], (previous) =>
          previous ? { ...previous, isExpired: true } : previous,
        );
      }
      setDialog(null);
    });
  return (
    <AuthGate>
      <Screen title="بررسی و پرداخت خرید">
        <Text muted style={{ fontSize: 13, lineHeight: 27, marginBottom: 24 }}>
          {reserveDescription}
        </Text>
        <QueryState
          loading={query.isLoading && !confirmed}
          error={!confirmed && query.error}
          retry={() => query.refetch()}
        />
        {c && (
          <Card style={panel}>
            <Text muted style={{ fontSize: 13 }}>
              شناسه خرید: {c.code}
            </Text>
            <View
              style={{
                backgroundColor: theme.mint,
                padding: 20,
                borderRadius: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 13, color: "#047857" }}>
                مبلغ قابل پرداخت
              </Text>
              <Text
                bold
                style={{ color: "#065F46", fontSize: 28, lineHeight: 44 }}
              >
                {money(c.payableAmount)}
              </Text>
              {!c.isSubmitted && !c.isPaid && !!c.deferredDeliveryFeeLimit && <Text>سقف رزرو جداگانه حمل نامشخص: {money(c.deferredDeliveryFeeLimit)} · مجموع رزرو: {money(c.payableAmount + c.deferredDeliveryFeeLimit)}</Text>}
            </View>
            {c.orders.map((order) => (
              <View
                key={order.code}
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 16,
                  borderRadius: 16,
                  gap: 14,
                }}
              >
                <AmountRow
                  label={order.farmName}
                  value={order.totalPrice}
                  strong
                />
                {order.orderItems?.map((product) => (
                  <View
                    key={product.code}
                    style={{
                      borderTopWidth: 1,
                      borderColor: "#F1F5F9",
                      paddingTop: 12,
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>{product.productName}</Text>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Text muted style={{ fontSize: 11 }}>
                        تعداد: {number(product.quantity)} {saleUnitLabel(product.saleUnit)}
                      </Text>
                      <Text muted style={{ fontSize: 12 }}>
                        {money(product.lineTotal)}
                      </Text>
                    </View>
                  </View>
                ))}
                <Button
                  outline
                  title="مشاهده سفارش ←"
                  onPress={() =>
                    navigation.navigate("Order", { code: order.code })
                  }
                />
              </View>
            ))}
            {submitted ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 16,
                  padding: 20,
                  gap: 20,
                }}
              >
                <Text muted style={{ fontSize: 13, lineHeight: 29 }}>
                  {successDescription}
                </Text>
                <Button
                  title="مشاهده سفارش‌ها ←"
                  onPress={() => navigation.navigate("Orders")}
                />
              </View>
            ) : expired ? (
              <View
                style={{
                  backgroundColor: "#FFFBEB",
                  borderRadius: 12,
                  padding: 20,
                  gap: 16,
                }}
              >
                <Text style={{ color: "#92400E", fontSize: 13 }}>
                  مهلت پرداخت این خرید تمام شده است.
                </Text>
                <Button
                  outline
                  title="بازگشت به سبد خرید"
                  onPress={() => navigation.navigate("Cart")}
                />
              </View>
            ) : (
              <>
                <Text muted style={{ fontSize: 12 }}>
                  مهلت پرداخت: {new Date(c.expiresAt).toLocaleString("fa-IR-u-ca-persian")}
                </Text>
                <View style={{ gap: 12 }}>
                  <Button
                    busy={busy}
                    title="پرداخت با کیف پول"
                    onPress={() => openDialog("pay")}
                  />
                  <Button
                    outline
                    disabled={busy}
                    title="لغو این خرید"
                    onPress={() => openDialog("cancel")}
                  />
                  <Button
                    outline
                    title="مشاهده کیف پول"
                    onPress={() => navigation.navigate("Wallet")}
                  />
                </View>
              </>
            )}
          </Card>
        )}
        <DeliveryPanel checkoutCode={code} />
      </Screen>
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setDialog(null);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 20,
            backgroundColor: "rgba(2,6,23,0.4)",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="بستن تأیید خرید"
            disabled={busy}
            onPress={() => setDialog(null)}
            style={{ position: "absolute", inset: 0 }}
          />
          <Card
            accessibilityViewIsModal
            testID="checkout-confirmation"
            style={{
              padding: 24,
              gap: 20,
              width: "100%",
              maxWidth: 512,
              alignSelf: "center",
            }}
          >
            <Text bold style={{ fontSize: 20 }}>
              {dialogContent === "pay" ? "تأیید رزرو وجه" : "لغو خرید"}
            </Text>
            <Text style={{ fontSize: 13, lineHeight: 29 }}>
              {dialogContent === "pay"
                ? `مبلغ ${money((c?.payableAmount ?? 0) + (c?.deferredDeliveryFeeLimit ?? 0))} در کیف پول رزرو شود؟ ${c?.deferredDeliveryFeeLimit ? `از این مبلغ، ${money(c.deferredDeliveryFeeLimit)} سقف جداگانه حمل نامشخص است؛ هزینه واقعی تا همین سقف برداشت و باقی آزاد می‌شود. مازاد به تأیید دوباره شما نیاز دارد. ` : ""} پس از تأیید فروشنده، مبلغ سفارش او برداشت می‌شود و در صورت رد سفارش، رزرو آن آزاد می‌شود.`
                : "این خرید در انتظار پرداخت لغو شود؟"}
            </Text>
            <Button
              busy={busy}
              title={dialogContent === "pay" ? "تأیید رزرو وجه" : "تأیید لغو"}
              onPress={() => void confirm()}
            />
            <Button
              outline
              disabled={busy}
              title="انصراف"
              onPress={() => setDialog(null)}
            />
          </Card>
        </View>
      </Modal>
    </AuthGate>
  );
}
