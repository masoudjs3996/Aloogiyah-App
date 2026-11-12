import { AppModal as Modal } from "../molecules/AppModal";
import React, { useState } from "react";
import {
  View,

  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../atoms/Card";
import { Text } from "../atoms/Text";
import { Field } from "../atoms/Field";
import { Button } from "../atoms/Button";
import { Select } from "../molecules/Select";
import { PersianDateTimeField } from "../molecules/PersianDateTimeField";
import { platformApi } from "../../api/platform";
import { useAction } from "../../shared/hooks/useAction";
import { money, number, quantity } from "../../shared/utils/format";
import { persianDate, persianToISO } from "../../shared/utils/persian-date";
import {
  buildReport,
  qualityGrades,
  reportChoices,
  reportDraft,
  reportRows,
  type QualityReport,
} from "../../shared/utils/quality-report";
import type { Assessment } from "../../shared/types/platform";
import { theme } from "../../shared/theme";

export function QualityReportSummary({ report }: { report: QualityReport }) {
  return (
    <View
      style={{
        backgroundColor: theme.mint,
        padding: 16,
        borderRadius: 12,
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {reportRows(report).map(([label, value]) => (
        <View key={label} style={{ flexBasis: "46%", flexGrow: 1 }}>
          <Text muted style={{ fontSize: 12, lineHeight: 20 }}>
            {label}
          </Text>
          <Text
            bold
            style={{
              color: "#064E3B",
              marginTop: 4,
              fontSize: 14,
              lineHeight: 23,
            }}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function QualityAssessmentCard({
  item,
  children,
  onProductPress,
  onChatPress,
  chatBusy = false,
}: {
  item: Assessment;
  children?: React.ReactNode;
  onProductPress?: () => void;
  onChatPress?: () => void;
  chatBusy?: boolean;
}) {
  return (
    <Card
      style={{ padding: 20, marginBottom: 16, gap: 16, borderColor: "#F1F5F9" }}
    >
      <View
        style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}
      >
        <Ionicons name="clipboard-outline" size={32} color="#059669" />
        <Pressable
          accessibilityRole={onProductPress ? "link" : undefined}
          accessibilityLabel={item.productName || "مشاهده محصول"}
          disabled={!onProductPress}
          onPress={onProductPress}
          style={{ flex: 1 }}
        >
          <Text bold style={{ fontSize: 14 }}>
            {item.productName || "مشاهده محصول"}
          </Text>
        </Pressable>
        <Text
          style={{
            fontSize: 12,
            lineHeight: 20,
            color: item.qualityGrade === "PENDING" ? "#92400E" : "#047857",
            backgroundColor:
              item.qualityGrade === "PENDING" ? "#FFFBEB" : theme.mint,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20,
            maxWidth: "42%",
          }}
        >
          {item.qualityGrade === "PENDING"
            ? "در انتظار کارشناسی"
            : item.qualityGrade}
        </Text>
      </View>
      {!!item.requestDescription && (
        <View
          style={{
            backgroundColor: "#F8FAFC",
            padding: 12,
            borderRadius: 12,
            gap: 6,
          }}
        >
          <Text muted bold style={{ fontSize: 12 }}>
            شرح درخواست بازدید
            {item.requestedQuantity
              ? ` · ${number(item.requestedQuantity)} کیلوگرم`
              : ""}
          </Text>
          <Text muted style={{ fontSize: 14, lineHeight: 28 }}>
            {item.requestDescription}
          </Text>
        </View>
      )}
      {!!item.paidAt && (
        <Text style={{ color: "#047857", fontSize: 12, lineHeight: 22 }}>
          پرداخت‌شده: {money(item.paidAmount)} ·{" "}
          {item.expertCode ? "کارشناس تخصیص یافته" : "در انتظار تخصیص کارشناس"}
        </Text>
      )}
      {!!item.qualityDescription && (
        <Text muted style={{ fontSize: 14, lineHeight: 28 }}>
          {item.qualityDescription}
        </Text>
      )}
      {item.report && item.qualityGrade !== "PENDING" && (
        <QualityReportSummary report={item.report} />
      )}
      <View
        style={{
          flexDirection: "row-reverse",
          flexWrap: "wrap",
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderColor: "#F1F5F9",
          paddingTop: 16,
          gap: 10,
        }}
      >
        <Text style={{ color: "#94A3B8", fontSize: 14 }}>
          {persianDate(item.assessmentDate || item.createdAt, true)}
        </Text>
        {item.suggestedPrice != null && (
          <Text bold style={{ color: "#065F46", fontSize: 14 }}>
            قیمت پیشنهادی: {money(item.suggestedPrice)}
          </Text>
        )}
      </View>
      {(children || onChatPress) && (
        <View
          style={{
            flexDirection: "row-reverse",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {children}
          {onChatPress && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="گفت‌وگو با کارشناس"
              disabled={chatBusy}
              onPress={onChatPress}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 12,
                opacity: chatBusy ? 0.5 : 1,
              }}
            >
              <Text bold style={{ fontSize: 12, color: "#047857" }}>
                {chatBusy ? "در حال آماده‌سازی گفت‌وگو…" : "گفت‌وگو با کارشناس"}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  );
}

export function QualityReportEditor({ item }: { item: Assessment }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(() => reportDraft(item.report));
  const [grade, setGrade] = useState(
    qualityGrades.includes(item.qualityGrade) ? item.qualityGrade : "",
  );
  const [description, setDescription] = useState(
    item.qualityGrade === "PENDING" ? "" : item.qualityDescription,
  );
  const [price, setPrice] = useState(
    item.suggestedPrice == null ? "" : String(item.suggestedPrice),
  );
  const [assessmentDate, setAssessmentDate] = useState("");
  const { busy, run } = useAction();
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width >= 640;
  const cell = {
    width: wide ? ("47%" as const) : ("100%" as const),
    flexGrow: 1,
  };
  const openForm = () => {
    setReport(reportDraft(item.report));
    setGrade(
      qualityGrades.includes(item.qualityGrade) ? item.qualityGrade : "",
    );
    setDescription(
      item.qualityGrade === "PENDING" ? "" : item.qualityDescription,
    );
    setPrice(item.suggestedPrice == null ? "" : String(item.suggestedPrice));
    setAssessmentDate("");
    setOpen(true);
  };
  const save = async () => {
    const saved = await run(async () => {
      const structured = buildReport(report);
      if (!qualityGrades.includes(grade) || !description.trim())
        throw new Error("درجه کیفیت و نظر کارشناس را تکمیل کنید");
      const suggestedPrice = price.trim() ? quantity(price) : undefined;
      if (
        suggestedPrice != null &&
        (!Number.isFinite(suggestedPrice) || suggestedPrice < 0)
      )
        throw new Error("قیمت پیشنهادی معتبر وارد کنید");
      return platformApi.updateAssessment({
        code: item.code,
        expertCode: item.expertCode!,
        qualityGrade: grade,
        qualityDescription: description.trim(),
        suggestedPrice,
        report: structured,
        assessmentDate: assessmentDate.trim()
          ? persianToISO(assessmentDate)
          : item.assessmentDate,
      });
    }, "گزارش ثبت شد");
    if (saved) setOpen(false);
  };
  return (
    <>
      <Button
        title="ویرایش / تکمیل گزارش"
        outline
        onPress={openForm}
        style={{ alignSelf: "flex-end" }}
      />
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            backgroundColor: "#0F172A66",
            justifyContent: "flex-end",
            paddingTop: insets.top,
          }}
        >
          <View
            testID="quality-report-editor"
            accessibilityViewIsModal
            style={{
              height: "92%",
              maxWidth: 768,
              width: "100%",
              alignSelf: "center",
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                padding: 20,
                flexDirection: "row-reverse",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottomWidth: 1,
                borderColor: "#F1F5F9",
              }}
            >
              <Text bold style={{ fontSize: 20 }}>
                گزارش کارشناسی
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بستن گزارش کارشناسی"
                disabled={busy}
                onPress={() => setOpen(false)}
                style={{ padding: 8 }}
              >
                <Ionicons name="close-outline" size={24} color={theme.ink} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 20 }}
            >
              <View
                style={{
                  flexDirection: "row-reverse",
                  flexWrap: "wrap",
                  columnGap: 20,
                  rowGap: 4,
                }}
              >
                <View style={cell}>
                  <Field
                    label="کد کارشناس"
                    value={item.expertCode || ""}
                    editable={false}
                    style={{ textAlign: "left" }}
                  />
                </View>
                <View style={cell}>
                  <Select
                    label="درجه کیفیت"
                    value={grade}
                    onChange={setGrade}
                    options={qualityGrades.map((label) => ({
                      value: label,
                      label,
                    }))}
                  />
                </View>
                <View style={cell}>
                  <Field
                    label="قیمت پیشنهادی (تومان)"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={cell}>
                  <PersianDateTimeField
                    label="زمان ارزیابی"
                    value={assessmentDate}
                    onChangeText={setAssessmentDate}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row-reverse",
                  flexWrap: "wrap",
                  columnGap: 20,
                  rowGap: 4,
                  marginTop: 8,
                }}
              >
                {reportChoices.map((field) => (
                  <View key={field.key} style={cell}>
                    <Select
                      label={field.label}
                      value={report[field.key]}
                      onChange={(value) =>
                        setReport((previous) => ({
                          ...previous,
                          [field.key]: value,
                        }))
                      }
                      options={field.options.map((label) => ({
                        value: label,
                        label,
                      }))}
                    />
                  </View>
                ))}
                <View style={cell}>
                  <Field
                    label="درصد آسیب"
                    value={report.damagePercent}
                    onChangeText={(value) =>
                      setReport({ ...report, damagePercent: value })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={cell}>
                  <Field
                    label="مقدار بررسی‌شده"
                    value={report.inspectedQuantity}
                    onChangeText={(value) =>
                      setReport({ ...report, inspectedQuantity: value })
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={{ marginTop: 8 }}>
                <Field
                  label="نظر کارشناس"
                  multiline
                  maxLength={1000}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </ScrollView>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 12),
                borderTopWidth: 1,
                borderColor: "#F1F5F9",
                backgroundColor: "white",
              }}
            >
              <Button
                title="ثبت گزارش کارشناسی"
                busy={busy}
                onPress={() => void save()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
