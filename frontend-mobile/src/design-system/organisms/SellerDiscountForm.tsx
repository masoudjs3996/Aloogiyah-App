import { AppModal as Modal } from "../molecules/AppModal";
import React, { useState } from "react";
import {

  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { request } from "../../api/platform";
import { Text } from "../atoms/Text";
import { Field } from "../atoms/Field";
import { Button } from "../atoms/Button";
import { Select } from "../molecules/Select";
import { MultiSelect } from "../molecules/MultiSelect";
import { PersianDateTimeField } from "../molecules/PersianDateTimeField";
import { persianToISO } from "../../shared/utils/persian-date";
import { amountDigits, formatAmount } from "../../shared/utils/amount";
import { theme } from "../../shared/theme";
type Product = {
  code: string;
  name: string;
  farmCode: string;
  farmName: string;
};
export function SellerDiscountForm({
  customerCode,
  customerName,
  onClose,
  onPrepare,
}: {
  customerCode: string;
  customerName: string;
  onClose: () => void;
  onPrepare: (text: string) => void;
}) {
  const products = useQuery({
    queryKey: ["seller-sales", "products"],
    queryFn: () => request<Product[]>("/SellerSales/Products"),
  });
  const recipient = useQuery({
    queryKey: ["seller-sales", "customer", customerCode],
    queryFn: () =>
      request<{ name: string }>(
        "/SellerSales/Customers/" + encodeURIComponent(customerCode),
      ),
  });
  const [farm, setFarm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState("0");
  const [value, setValue] = useState("");
  const [cap, setCap] = useState("");
  const [end, setEnd] = useState("");
  const [usage, setUsage] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  const farms = [
    ...new Map(
      (products.data || []).map((p) => [
        p.farmCode,
        { value: p.farmCode, label: p.farmName },
      ]),
    ).values(),
  ];
  const submit = async () => {
    setError("");
    try {
      const expiry = persianToISO(end);
      const amount = Number(value),
        limit = cap ? Number(cap) : null,
        count = Number(usage);
      if (
        !farm ||
        !value ||
        amount <= 0 ||
        (type === "0" && amount > 100) ||
        (limit !== null && limit <= 0) ||
        !Number.isInteger(count) ||
        count < 1 ||
        count > 100 ||
        !expiry ||
        Date.parse(expiry) <= Date.now()
      )
        throw new Error(
          "مزرعه، مقدار تخفیف، تاریخ آینده و تعداد استفادهٔ ۱ تا ۱۰۰ را معتبر وارد کنید.",
        );
      setBusy(true);
      const result = await request<{ code: string }>("/SellerSales/Discounts", {
        method: "POST",
        data: {
          customerCode,
          farmCode: farm,
          productCodes: selected,
          discountType: Number(type),
          value: amount,
          maxDiscountAmount: limit,
          endDate: expiry,
          maxUsage: count,
        },
      });
      setCreated(
        `کد تخفیف اختصاصی شما: ${result.code}\n${type === "0" ? value + "٪" : formatAmount(value) + " تومان"} تخفیف برای ${farms.find((f) => f.value === farm)?.label}؛ ${selected.length ? "فقط محصولات انتخاب‌شده" : "همهٔ محصولات این مزرعه"}؛ فقط برای حساب شما. اعتبار تا ${end}، حداکثر ${usage} بار.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "ساخت تخفیف انجام نشد");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingTop: 48,
            gap: 14,
            paddingBottom: 40,
          }}
        >
          <Text bold style={{ fontSize: 22 }}>
            کد تخفیف اختصاصی مشتری
          </Text>
          <View
            style={{
              padding: 16,
              backgroundColor: theme.mint,
              borderRadius: 16,
              gap: 8,
            }}
          >
            <Text muted>کد اختصاصی برای</Text>
            <Text bold>{recipient.data?.name || customerName}</Text>
            <Text>هزینهٔ این تخفیف از سهم فروش شما کم می‌شود.</Text>
          </View>
          {created ? (
            <>
              <Text selectable>{created}</Text>
              <Button
                title="آماده‌سازی پیام در گفت‌وگو"
                onPress={() => {
                  onPrepare(created);
                  onClose();
                }}
              />
            </>
          ) : (
            <>
              <Select
                required
                label="مزرعه"
                value={farm}
                onChange={(f) => {
                  setFarm(f);
                  setSelected([]);
                }}
                options={farms}
              />
              <MultiSelect
                label="محصولات (اختیاری؛ خالی یعنی همهٔ محصولات مزرعه)"
                value={selected}
                onChange={setSelected}
                options={(products.data || [])
                  .filter((p) => p.farmCode === farm)
                  .map((p) => ({ value: p.code, label: p.name }))}
              />
              <Select
                label="نوع تخفیف"
                value={type}
                onChange={setType}
                options={[
                  { value: "0", label: "درصدی" },
                  { value: "1", label: "مبلغ ثابت" },
                ]}
              />
              <Field
                required
                label={type === "0" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
                value={formatAmount(value)}
                onChangeText={(s) => setValue(amountDigits(s))}
                keyboardType="number-pad"
              />
              <Field
                label="سقف مبلغ تخفیف (تومان؛ اختیاری)"
                value={formatAmount(cap)}
                onChangeText={(s) => setCap(amountDigits(s))}
                keyboardType="number-pad"
              />
              <PersianDateTimeField
                label="پایان اعتبار"
                value={end}
                onChangeText={setEnd}
                futureOnly
              />
              <Field
                required
                label="حداکثر تعداد استفاده"
                value={usage}
                onChangeText={(s) => setUsage(amountDigits(s))}
                keyboardType="number-pad"
              />
              {!!(error || products.error || recipient.error) && (
                <Text style={{ color: theme.danger }}>
                  {error || products.error?.message || recipient.error?.message}
                </Text>
              )}
              <Button
                title="ساخت کد تخفیف"
                busy={busy}
                disabled={
                  products.isPending ||
                  recipient.isPending ||
                  !!products.error ||
                  !!recipient.error
                }
                onPress={() => void submit()}
              />
            </>
          )}
          <Button outline title="بستن" disabled={busy} onPress={onClose} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
