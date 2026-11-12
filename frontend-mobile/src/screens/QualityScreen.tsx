import { canChatWithExpert } from "../shared/utils/quality-report";
import {
  QualityReportEditor,
  QualityAssessmentCard,
} from "../design-system/organisms/QualityReport";
import React, { useEffect, useState, useRef } from "react";
import { View, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { attemptKey, completeAttempt } from "../shared/utils/attempt";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Card } from "../design-system/atoms/Card";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { Field } from "../design-system/atoms/Field";
import { QueryState } from "../design-system/molecules/QueryState";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { ProductPicker } from "../design-system/organisms/ProductPicker";
import { useAuth, useProfile } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { money, quantity } from "../shared/utils/format";
import { theme } from "../shared/theme";
import { useRoles } from "../shared/hooks/useRoles";
import type { QualityQuote } from "../shared/types/platform";
import type { Props } from "../navigation/types";
export function QualityScreen({ navigation, route }: Props<"Quality">) {
  const productCode = route.params?.productCode;
  const expert = useRoles().has("Expert");
  const profile = useProfile();
  const chat = useAction();
  const openChat = (code: string) =>
    chat.run(async () => {
      const room = await platformApi.assessmentConversation(code);
      navigation.navigate("ChatRoom", {
        code: room.code,
        title: room.peerName,
      });
    });
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [productCode]);
  const q = useQuery({
    queryKey: ["assessments", page, productCode, expert],
    queryFn: ({ signal }) =>
      platformApi.assessments(
        {
          PageNumber: page,
          PageSize: 12,
          AgriculturalProductCode: productCode || undefined,
          AssignedToMe: expert && !productCode,
        },
        signal,
      ),
    enabled: useAuth().signedIn,
  });
  return (
    <AuthGate>
      <Screen
        onRefresh={() => q.refetch()}
        refreshing={q.isRefetching}
        fixedFooter={
          !expert ? (
            <QualityRequestFooter
              onPress={() =>
                navigation.navigate("QualityForm", { productCode })
              }
            />
          ) : undefined
        }
      >
        {productCode && (
          <QualityProductContext
            onPress={() =>
              navigation.navigate("Product", { code: productCode })
            }
          />
        )}
        <QueryState
          loading={q.isLoading}
          error={q.error}
          retry={() => q.refetch()}
        />
        {!q.isLoading && !q.error && q.data?.items.length === 0 && (
          <Card style={{ paddingVertical: 28, alignItems: "center" }}>
            <Ionicons name="clipboard-outline" size={36} color={theme.muted} />
            <Text muted style={{ textAlign: "center", fontSize: 13 }}>
              هنوز گزارش یا درخواست کارشناسی برای این بخش ثبت نشده است.
            </Text>
          </Card>
        )}
        {q.data?.items.map((a) => (
          <QualityAssessmentCard
            key={a.code}
            item={a}
            onProductPress={() =>
              navigation.navigate("Product", {
                code: a.agriculturalProductCode,
              })
            }
            chatBusy={chat.busy}
            onChatPress={
              canChatWithExpert(a, profile.data?.user?.code)
                ? () => void openChat(a.code)
                : undefined
            }
          >
            {expert && a.expertCode === profile.data?.user?.code && (
              <QualityReportEditor item={a} />
            )}
            <Button
              outline
              title="گزارش و جزئیات"
              onPress={() =>
                navigation.navigate("Assessment", { code: a.code })
              }
            />
          </QualityAssessmentCard>
        ))}
        {!!q.data && q.data.totalCount > q.data.pageSize && (
          <Button
            outline
            title="صفحهٔ بعد"
            disabled={!q.data || page * q.data.pageSize >= q.data.totalCount}
            onPress={() => setPage(page + 1)}
          />
        )}
        {page > 1 && (
          <Button outline title="صفحهٔ قبل" onPress={() => setPage(page - 1)} />
        )}
      </Screen>
    </AuthGate>
  );
}
export function QualityFormScreen({ route, navigation }: Props<"QualityForm">) {
  const [code, setCode] = useState(route.params?.productCode || "");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [discount, setDiscount] = useState("");
  const [quote, setQuote] = useState<QualityQuote>();
  const lock = useRef(false);
  const { busy, run } = useAction();
  const tariff = useQuery({
    queryKey: ["quality-tariff"],
    queryFn: platformApi.qualityFee,
    enabled: useAuth().signedIn,
  });
  const insufficient = !!quote && quote.availableBalance < quote.payableAmount;
  const price = () =>
    run(async () => {
      const value = quantity(amount);
      if (
        !code ||
        !desc.trim() ||
        !Number.isFinite(value) ||
        value < 0.01 ||
        value > 100000000
      )
        throw new Error(
          "محصول، مقدار معتبر بین ۰٫۰۱ تا ۱۰۰٬۰۰۰٬۰۰۰ کیلوگرم و شرح درخواست الزامی است",
        );
      setQuote(
        await platformApi.quoteQuality({
          agriculturalProductCode: code,
          discountCode: discount.trim() || undefined,
        }),
      );
    });
  const pay = () =>
    run(async () => {
      if (!quote || insufficient || lock.current) return;
      lock.current = true;
      try {
        const data = {
          agriculturalProductCode: code,
          quantity: quantity(amount),
          requestDescription: desc.trim(),
          discountCode: discount.trim() || undefined,
          expectedAmount: quote.payableAmount,
        };
        const key = await attemptKey("quality", JSON.stringify(data));
        await platformApi.requestQuality({ ...data, idempotencyKey: key });
        await completeAttempt("quality");
        navigation.goBack();
      } finally {
        lock.current = false;
      }
    }, "پرداخت انجام شد و درخواست کارشناسی ثبت شد");
  const footer = (
    <View
      style={{
        backgroundColor: "white",
        borderTopWidth: 1,
        borderColor: theme.border,
        padding: 12,
        flexDirection: "row-reverse",
        gap: 10,
      }}
    >
      {quote ? (
        <>
          <Button
            outline
            style={{ flex: 1 }}
            title="ویرایش درخواست"
            disabled={busy}
            onPress={() => setQuote(undefined)}
          />
          <Button
            style={{ flex: 2, backgroundColor: "#047857" }}
            busy={busy}
            disabled={insufficient}
            title="تأیید پرداخت و ثبت درخواست"
            onPress={() => void pay()}
          />
        </>
      ) : (
        <Button
          style={{ flex: 1, backgroundColor: "#047857" }}
          busy={busy}
          disabled={!code || tariff.isLoading || !!tariff.error || !tariff.data}
          title="بررسی هزینه و ادامه"
          onPress={() => void price()}
        />
      )}
    </View>
  );
  return (
    <AuthGate>
      <Screen fixedFooter={footer}>
        <Card style={{ padding: 20, gap: 16 }}>
          <View
            accessibilityLabel="مراحل درخواست"
            style={{
              flexDirection: "row-reverse",
              backgroundColor: theme.bg,
              padding: 12,
              borderRadius: 12,
              gap: 16,
            }}
          >
            <Text
              bold={!quote}
              style={{ fontSize: 12, color: !quote ? "#047857" : theme.muted }}
            >
              ۱. شرح درخواست
            </Text>
            <Text
              bold={!!quote}
              style={{ fontSize: 12, color: quote ? "#047857" : theme.muted }}
            >
              ۲. تأیید و پرداخت
            </Text>
          </View>
          {!quote ? (
            <>
              {!route.params?.productCode && (
                <ProductPicker value={code} onChange={setCode} />
              )}
              <Field
                label="مقدار محصول برای بررسی (کیلوگرم)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Field
                label="شرح درخواست و هماهنگی بازدید"
                value={desc}
                onChangeText={setDesc}
                multiline
                maxLength={700}
                placeholder="محل بازدید، مقدار محصول و مواردی که نیاز به بررسی دارند"
              />
              <Field
                label="کد تخفیف کیفیت‌سنجی (اختیاری)"
                value={discount}
                onChangeText={setDiscount}
                maxLength={100}
                autoCapitalize="none"
                style={{ textAlign: "left", writingDirection: "ltr" }}
              />
              <QueryState
                loading={tariff.isLoading}
                error={tariff.error}
                retry={() => tariff.refetch()}
              />
              {tariff.data != null && !tariff.error && (
                <View
                  style={{
                    backgroundColor: theme.mint,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <Text style={{ color: "#065F46", fontSize: 13 }}>
                    هزینهٔ کارشناسی: {money(tariff.data)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text muted style={{ fontSize: 13, lineHeight: 27 }}>
                {desc}
              </Text>
              <View
                style={{
                  backgroundColor: theme.mint,
                  borderRadius: 16,
                  padding: 16,
                  gap: 14,
                }}
              >
                {[
                  { label: "هزینه کارشناسی", value: quote.fee },
                  { label: "تخفیف", value: quote.discountAmount },
                  { label: "مبلغ پرداخت", value: quote.payableAmount },
                ].map((row, index) => (
                  <View
                    key={row.label}
                    style={{
                      flexDirection: "row-reverse",
                      justifyContent: "space-between",
                      gap: 12,
                      ...(index === 2
                        ? {
                            borderTopWidth: 1,
                            borderColor: "#A7F3D0",
                            paddingTop: 12,
                          }
                        : {}),
                    }}
                  >
                    <Text
                      bold={index === 2}
                      style={{
                        fontSize: 13,
                        color: index === 2 ? "#065F46" : theme.ink,
                      }}
                    >
                      {row.label}
                    </Text>
                    <Text
                      bold={index === 2}
                      style={{
                        fontSize: 13,
                        color: index === 2 ? "#065F46" : theme.ink,
                      }}
                    >
                      {money(row.value)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text muted style={{ fontSize: 13 }}>
                موجودی آزاد کیف پول: {money(quote.availableBalance)}
              </Text>
              {insufficient ? (
                <View
                  style={{
                    backgroundColor: "#FFFBEB",
                    padding: 16,
                    borderRadius: 12,
                    gap: 12,
                  }}
                >
                  <Text style={{ color: "#92400E", fontSize: 13 }}>
                    موجودی کافی نیست.
                  </Text>
                  <Button
                    outline
                    title="شارژ کیف پول"
                    onPress={() => navigation.navigate("Wallet")}
                  />
                  <Button
                    outline
                    title="بررسی دوباره موجودی"
                    busy={busy}
                    onPress={() => void price()}
                  />
                </View>
              ) : (
                <Text muted style={{ fontSize: 12, lineHeight: 25 }}>
                  با تأیید، مبلغ از کیف پول کسر و درخواست برای تخصیص کارشناس ثبت
                  می‌شود.
                </Text>
              )}
            </>
          )}
        </Card>
      </Screen>
    </AuthGate>
  );
}
export function AssessmentScreen({ route, navigation }: Props<"Assessment">) {
  const code = route.params.code;
  const q = useQuery({
    queryKey: ["assessment", code],
    queryFn: () => platformApi.assessment(code),
    enabled: useAuth().signedIn,
  });
  const profile = useProfile();
  const expertRole = useRoles().has("Expert");
  const a = q.data;
  const chat = useAction();
  const openChat = () =>
    chat.run(async () => {
      const room = await platformApi.assessmentConversation(code);
      navigation.navigate("ChatRoom", {
        code: room.code,
        title: room.peerName,
      });
    });
  return (
    <AuthGate>
      <Screen
        title="خرید مطمئن با تعیین کیفیت"
        fixedFooter={
          !expertRole && a ? (
            <QualityRequestFooter
              onPress={() =>
                navigation.navigate("QualityForm", {
                  productCode: a.agriculturalProductCode,
                })
              }
            />
          ) : undefined
        }
      >
        <QueryState
          loading={q.isLoading}
          error={q.error}
          retry={() => q.refetch()}
        />
        {a && (
          <>
            <QualityProductContext
              onPress={() =>
                navigation.navigate("Product", {
                  code: a.agriculturalProductCode,
                })
              }
            />
            <QualityAssessmentCard
              item={a}
              onProductPress={() =>
                navigation.navigate("Product", {
                  code: a.agriculturalProductCode,
                })
              }
              chatBusy={chat.busy}
              onChatPress={
                canChatWithExpert(a, profile.data?.user?.code)
                  ? () => void openChat()
                  : undefined
              }
            >
              {expertRole && a.expertCode === profile.data?.user?.code && (
                <QualityReportEditor key={a.code} item={a} />
              )}
            </QualityAssessmentCard>
          </>
        )}
      </Screen>
    </AuthGate>
  );
}

function QualityProductContext({ onPress }: { onPress: () => void }) {
  return (
    <View
      style={{
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        backgroundColor: theme.mint,
        gap: 12,
        alignItems: "flex-end",
      }}
    >
      <Text style={{ color: "#065F46", fontSize: 14 }}>
        گزارش‌ها و درخواست‌های کارشناسی همین محصول
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="بازگشت به محصول"
        onPress={onPress}
      >
        <Text bold style={{ color: "#065F46", fontSize: 14 }}>
          بازگشت به محصول ←
        </Text>
      </Pressable>
    </View>
  );
}

function QualityRequestFooter({ onPress }: { onPress: () => void }) {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderTopWidth: 1,
        borderColor: theme.border,
        padding: 12,
      }}
    >
      <Button
        title="درخواست تعیین کیفیت"
        onPress={onPress}
        icon={<Ionicons name="add-outline" size={22} color="white" />}
      />
    </View>
  );
}
