import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Badge } from "../design-system/atoms/Badge";
import { Button } from "../design-system/atoms/Button";
import { Field } from "../design-system/atoms/Field";
import { Select } from "../design-system/molecules/Select";
import { PersianDateTimeField } from "../design-system/molecules/PersianDateTimeField";
import { QueryState } from "../design-system/molecules/QueryState";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { platformApi } from "../api/platform";
import { useAuth, useProfile } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { quantity, money } from "../shared/utils/format";
import { persianDate, persianToISO } from "../shared/utils/persian-date";
import { dateError } from "../shared/utils/persian-calendar";
import { theme } from "../shared/theme";
import { useRoles } from "../shared/hooks/useRoles";
import type { Props } from "../navigation/types";
const serviceTypes = ["رسیدگی به گلدان", "رسیدگی به باغچه", "رسیدگی به گلخانه"];
const typeNumber = (type: number | string) =>
  ({ Vase: 0, Garden: 1, Greenhouse: 2 })[String(type)] ?? Number(type);
const serviceLabel = (type: number | string) =>
  serviceTypes[typeNumber(type)] || "درخواست خدمت";
function statusLabel(code: string) {
  try {
    return (
      JSON.parse(process.env.EXPO_PUBLIC_SERVICE_STATUS_LABELS || "{}")[code] ||
      "درخواست ثبت‌شده"
    );
  } catch {
    return "درخواست ثبت‌شده";
  }
}
export function ServicesScreen({ navigation }: Props<"Services">) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const profile = useProfile();
  const roles = useRoles();
  const q = useQuery({
    queryKey: ["services", page, filter],
    queryFn: () =>
      platformApi.services({
        PageNumber: page,
        PageSize: 12,
        ServiceType: filter || undefined,
      }),
    enabled: useAuth().signedIn,
  });
  const { run } = useAction();
  return (
    <AuthGate>
      <Screen
        onRefresh={() => {
          void q.refetch();
        }}
        refreshing={q.isRefetching}
      >
        <Button
          title="درخواست جدید"
          icon={<Ionicons name="add" size={20} color="white" />}
          onPress={() => navigation.navigate("ServiceForm")}
        />
        <View style={{ marginTop: 20 }}>
          <Select
            label="نوع خدمت"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "همه خدمات" },
              ...["گلدان", "باغچه", "گلخانه"].map((label, i) => ({
                value: String(i),
                label,
              })),
            ]}
          />
        </View>
        <QueryState
          loading={q.isLoading}
          error={q.error}
          empty={q.data?.items.length === 0}
          emptyText="هنوز درخواست خدماتی ثبت نشده است"
          retry={() => q.refetch()}
        />
        {q.data?.items.map((s) => (
          <Card key={s.code} style={{ padding: 20 }}>
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: theme.mint,
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <Ionicons
                  name="construct-outline"
                  size={24}
                  color={theme.green}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text bold>{serviceLabel(s.serviceType)}</Text>
                <Text muted style={{ fontSize: 11 }}>
                  {s.code}
                </Text>
              </View>
              <View style={{ maxWidth: "38%" }}>
                <Badge title={statusLabel(s.statusCode)} />
              </View>
            </View>
            <Text muted style={{ marginTop: 6, lineHeight: 28 }}>
              {s.description}
            </Text>
            {(s.addressStreet || s.addressCounty) && (
              <View
                style={{
                  backgroundColor: theme.mint,
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "#065F46" }}>
                  <Text bold>نشانی مراجعه: </Text>
                  {[
                    s.addressProvince,
                    s.addressCounty,
                    s.addressCity,
                    s.addressStreet,
                  ]
                    .filter(Boolean)
                    .join("، ")}
                </Text>
              </View>
            )}
            <View
              style={{
                borderTopWidth: 1,
                borderColor: theme.border,
                paddingTop: 12,
                flexDirection: "row-reverse",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text muted style={{ fontSize: 12 }}>
                <Ionicons name="calendar-outline" size={15} />{" "}
                {persianDate(s.serviceDate, true)}
              </Text>
              <Text bold style={{ color: "#065F46" }}>
                {money(s.price)}
              </Text>
            </View>
            {s.userCode === profile.data?.user?.code && !s.providerCode && (
              <Button
                outline
                compact
                title="ویرایش درخواست"
                onPress={() =>
                  navigation.navigate("ServiceForm", { code: s.code })
                }
              />
            )}
            <Button
              outline
              compact
              title={
                roles.has("Provider") &&
                s.providerCode === profile.data?.user?.code
                  ? "به‌روزرسانی وضعیت خدمت"
                  : "جزئیات درخواست"
              }
              onPress={() => navigation.navigate("Service", { code: s.code })}
            />
            {s.providerCode && (
              <Button
                outline
                compact
                title={
                  s.providerCode === profile.data?.user?.code
                    ? "گفت‌وگو با درخواست‌کننده"
                    : "گفت‌وگو با کارشناس"
                }
                onPress={() =>
                  run(async () => {
                    const peer =
                      s.providerCode === profile.data?.user?.code
                        ? s.userCode
                        : s.providerCode!;
                    const r = await platformApi.getOrCreateConversation(peer);
                    navigation.navigate("ChatRoom", {
                      code: r.code,
                      title: r.peerName,
                    });
                  })
                }
              />
            )}
          </Card>
        ))}
        {q.data && q.data.totalCount > 12 && (
          <View style={{ flexDirection: "row-reverse", gap: 10 }}>
            <Button
              outline
              title="صفحهٔ قبل"
              disabled={page <= 1}
              onPress={() => setPage(page - 1)}
              style={{ flex: 1 }}
            />
            <Button
              outline
              title="صفحهٔ بعد"
              disabled={page * 12 >= q.data.totalCount}
              onPress={() => setPage(page + 1)}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </Screen>
    </AuthGate>
  );
}
export function ServiceFormScreen({ route, navigation }: Props<"ServiceForm">) {
  const signedIn = useAuth().signedIn;
  const code = route.params?.code;
  const existing = useQuery({
    queryKey: ["service", code],
    queryFn: () => platformApi.service(code!),
    enabled: signedIn && !!code,
  });
  const addresses = useQuery({
    queryKey: ["addresses", "service-request"],
    queryFn: () => platformApi.addresses({ PageSize: 50 }),
    enabled: signedIn && !code,
  });
  const [type, setType] = useState("0");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const initialized = useRef(false);
  const knownAddresses = useRef<string[] | undefined>(undefined);
  const { busy, run } = useAction();
  useEffect(() => {
    if (!existing.data || initialized.current) return;
    initialized.current = true;
    const s = existing.data;
    setType(String(typeNumber(s.serviceType)));
    setDescription(s.description);
    setAmount(
      String(s.numberOfVases ?? s.gardenArea ?? s.greenhouseArea ?? ""),
    );
  }, [existing.data]);
  useEffect(() => {
    if (!addresses.data) return;
    const items = addresses.data.items;
    const added =
      knownAddresses.current &&
      items.find((a) => !knownAddresses.current!.includes(a.code));
    knownAddresses.current = items.map((a) => a.code);
    if (added) setAddress(added.code);
    else if (!items.some((a) => a.code === address))
      setAddress((items.find((a) => a.isDefault) || items[0])?.code || "");
  }, [addresses.data, address]);
  return (
    <AuthGate>
      <Screen
        title={code ? "ویرایش درخواست" : "درخواست رسیدگی"}
        fixedFooter={
          !code || existing.data ? (
            <View
              style={{
                borderTopWidth: 1,
                borderColor: theme.border,
                padding: 12,
                backgroundColor: "white",
              }}
            >
              <Button
                title="ثبت درخواست"
                busy={busy}
                disabled={
                  !code &&
                  (!address ||
                    addresses.isLoading ||
                    !!addresses.error ||
                    !addresses.data?.items.some((a) => a.code === address))
                }
                onPress={() =>
                  run(
                    async () => {
                      const scheduleError = dateError(day, {
                        maxDaysAhead: 20,
                      });
                      if (scheduleError) throw new Error(scheduleError);
                      const n = quantity(amount);
                      if (!description.trim() || !Number.isFinite(n) || n <= 0)
                        throw new Error("شرح درخواست و مقدار مثبت الزامی است");
                      if (type === "0" && !Number.isInteger(n))
                        throw new Error("تعداد گلدان باید عدد صحیح باشد");
                      if (
                        !code &&
                        !addresses.data?.items.some((a) => a.code === address)
                      )
                        throw new Error("نشانی مراجعه را انتخاب کنید");
                      const input = {
                        serviceType: Number(type),
                        description: description.trim(),
                        serviceDate: day.trim()
                          ? persianToISO(day)
                          : existing.data?.serviceDate,
                        ...(type === "0"
                          ? { numberOfVases: n }
                          : type === "1"
                            ? { gardenArea: n }
                            : { greenhouseArea: n }),
                      };
                      if (code) {
                        await platformApi.updateService({ ...input, code });
                        navigation.goBack();
                      } else {
                        const r = await platformApi.createService({
                          ...input,
                          addressCode: address,
                        });
                        navigation.replace("Service", { code: r.code });
                      }
                    },
                    code ? "درخواست به‌روز شد" : "درخواست ثبت شد",
                  )
                }
              />
            </View>
          ) : undefined
        }
      >
        {!!code && (
          <QueryState
            loading={existing.isLoading}
            error={existing.error}
            retry={() => existing.refetch()}
          />
        )}
        {(!code || existing.data) && (
          <Card style={{ padding: 20 }}>
            <Select
              label="نوع خدمت"
              value={type}
              disabled={!!code}
              onChange={(v) => {
                setType(v);
                setAmount("");
              }}
              options={serviceTypes.map((label, i) => ({
                value: String(i),
                label,
              }))}
            />
            <Field
              label={type === "0" ? "تعداد گلدان" : "مساحت (متر مربع)"}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <PersianDateTimeField
              label="زمان پیشنهادی مراجعه"
              maxDaysAhead={20}
              value={day}
              onChangeText={setDay}
              hint={
                existing.data?.serviceDate
                  ? `زمان فعلی: ${persianDate(existing.data.serviceDate, true)}؛ خالی بگذارید تا حفظ شود`
                  : "اختیاری؛ زمان نهایی با کارشناس هماهنگ می‌شود"
              }
            />
            <Field
              multiline
              label="شرح مشکل و خدمات موردنیاز"
              value={description}
              onChangeText={setDescription}
              maxLength={code ? 1000 : 800}
              placeholder="مثلاً برگ‌ها زرد شده‌اند و به تعویض خاک نیاز دارم"
            />
            {!code && (
              <View
                style={{
                  backgroundColor: theme.mint,
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#D1FAE5",
                  gap: 10,
                }}
              >
                <QueryState
                  loading={addresses.isLoading}
                  error={addresses.error}
                  retry={() => addresses.refetch()}
                />
                <Select
                  label="نشانی مراجعه"
                  value={address}
                  disabled={
                    addresses.isLoading ||
                    !!addresses.error ||
                    !addresses.data?.items.length
                  }
                  onChange={setAddress}
                  options={
                    addresses.data?.items.map((a) => ({
                      value: a.code,
                      label:
                        [
                          a.provinceName,
                          a.countyName,
                          a.cityName || a.villageName,
                          a.street,
                        ]
                          .filter(Boolean)
                          .join("، ") + (a.isDefault ? " (پیش‌فرض)" : ""),
                    })) || []
                  }
                />
                {!addresses.isLoading &&
                  !addresses.error &&
                  !addresses.data?.items.length && (
                    <Text style={{ color: "#92400E" }}>
                      هنوز نشانی‌ای ذخیره نکرده‌اید. ابتدا یک نشانی ثبت کنید.
                    </Text>
                  )}
                <Button
                  outline
                  title="افزودن نشانی جدید"
                  onPress={() => navigation.navigate("AddressForm")}
                />
              </View>
            )}
          </Card>
        )}
      </Screen>
    </AuthGate>
  );
}
export function ServiceScreen({ route, navigation }: Props<"Service">) {
  const code = route.params.code;
  const q = useQuery({
    queryKey: ["service", code],
    queryFn: () => platformApi.service(code),
    enabled: useAuth().signedIn,
  });
  const { busy, run } = useAction();
  const s = q.data;
  const profile = useProfile();
  const roles = useRoles();
  const [status, setStatus] = useState("");

  const labels: Record<string, string> = (() => {
    try {
      return JSON.parse(process.env.EXPO_PUBLIC_SERVICE_STATUS_LABELS || "{}");
    } catch {
      return {};
    }
  })();
  return (
    <AuthGate>
      <Screen>
        <QueryState
          loading={q.isLoading}
          error={q.error}
          retry={() => q.refetch()}
        />
        {s && (
          <Card>
            <Text bold style={{ fontSize: 21 }}>
              {serviceLabel(s.serviceType)}
            </Text>
            <Text>{s.description}</Text>
            <Text muted>وضعیت: {statusLabel(s.statusCode)}</Text>
            <Text>
              {s.addressProvince}، {s.addressCity}، {s.addressStreet}
            </Text>
            <Text>تاریخ: {persianDate(s.serviceDate, true)}</Text>
            <Text>قیمت: {money(s.price)}</Text>
            {s.userCode === profile.data?.user?.code && !s.providerCode && (
              <Button
                outline
                title="ویرایش درخواست"
                onPress={() => navigation.navigate("ServiceForm", { code })}
              />
            )}
            {roles.has("Provider") &&
              s.providerCode === profile.data?.user?.code && (
                <>
                  <Select
                    label="وضعیت خدمت"
                    value={status || s.statusCode}
                    onChange={setStatus}
                    options={Object.entries({
                      ...labels,
                      [s.statusCode]: labels[s.statusCode] || s.statusCode,
                    }).map(([value, label]) => ({ value, label }))}
                  />

                  <Button
                    busy={busy}
                    title="ثبت وضعیت"
                    onPress={() =>
                      run(
                        () =>
                          platformApi.updateService({
                            code,
                            statusCode: status || s.statusCode,
                          }),
                        "وضعیت به‌روز شد",
                      )
                    }
                  />
                </>
              )}
            {s.providerCode && (
              <Button
                outline
                title="گفت‌وگو دربارهٔ خدمت"
                onPress={() =>
                  run(async () => {
                    const peer =
                      s.providerCode === profile.data?.user?.code
                        ? s.userCode
                        : s.providerCode!;
                    const r = await platformApi.getOrCreateConversation(peer);
                    navigation.navigate("ChatRoom", {
                      code: r.code,
                      title: r.peerName,
                    });
                  })
                }
              />
            )}
          </Card>
        )}
      </Screen>
    </AuthGate>
  );
}
