import { usePollingInterval } from "../shared/hooks/usePollingInterval";
import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, View, Platform, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { businessApi } from "../api/business";
import { platformApi } from "../api/platform";
import { useAuth } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { date } from "../shared/utils/format";
import {
  businessTypes,
  businessStatuses,
  businessActions,
  businessDocumentKinds,
  businessDocumentLabel,
  type BusinessDocumentKind,
  type BusinessType,
  type BusinessApplication,
  type BusinessDocument,
} from "../shared/types/business";
import { Screen } from "../design-system/templates/Screen";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { Card } from "../design-system/atoms/Card";
import { Text } from "../design-system/atoms/Text";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { Select } from "../design-system/molecules/Select";
import { QueryState } from "../design-system/molecules/QueryState";
import { theme } from "../shared/theme";
import type { Props } from "../navigation/types";
import { MarketplaceTermsModal } from "../design-system/organisms/MarketplaceTermsModal";

const roleOptions = [
  { value: "Farmer", title: "کشاورز", description: "ثبت مزرعه و آگهی فروش", icon: "leaf-outline", background: "#ECFDF5", color: "#065F46", border: "#059669" },
  { value: "Shop", title: "مغازه‌دار", description: "خرید مستقیم از تولیدکننده", icon: "storefront-outline", background: "#FBF4E3", color: "#193F32", border: "#F1CB75" },
] as const;

export function BusinessScreen({ navigation, route }: Props<"Business">) {
  const signedIn = useAuth().signedIn;
  const terms = useQuery({ queryKey: ["marketplace-terms", "current"], queryFn: businessApi.terms, enabled: signedIn });
  const [acceptedHash, setAcceptedHash] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const q = useQuery({
    queryKey: ["business-applications"],
    queryFn: businessApi.mine,
    enabled: signedIn,
    refetchInterval: usePollingInterval(30000),
  });
  const addresses = useQuery({
    queryKey: ["addresses", "business"],
    queryFn: () => platformApi.addresses({ PageSize: 100 }),
    enabled: signedIn,
  });
  const [form, setForm] = useState(false),
    [editing, setEditing] = useState<BusinessApplication>(),
    [kind, setKind] = useState<BusinessType>("Farmer"),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [license, setLicense] = useState(""),
    [address, setAddress] = useState(""),
    [files, setFiles] = useState<Partial<Record<BusinessDocumentKind, DocumentPicker.DocumentPickerAsset>>>({}),
    [removed, setRemoved] = useState<string[]>([]);
  const { busy, run } = useAction();
  const roleTransition = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (active) reduceMotion.current = enabled;
    }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", enabled => {
      reduceMotion.current = enabled;
      if (enabled) roleTransition.setValue(1);
    });
    return () => { active = false; subscription.remove(); roleTransition.stopAnimation(); };
  }, [roleTransition]);
  const selectRole = (role: BusinessType) => {
    if (role === kind || editing || busy) return;
    setAcceptedHash("");
    setFiles({});
    setKind(role);
    if (!reduceMotion.current) {
      roleTransition.setValue(0);
      Animated.timing(roleTransition, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  };
  useEffect(() => {
    if (route.params?.type) {
      setAcceptedHash("");
      setFiles({});
      setKind(route.params.type);
      setForm(true);
    }
  }, [route.params?.type]);
  const clear = () => {
    setAcceptedHash("");
    setForm(false);
    setEditing(undefined);
    setName("");
    setDescription("");
    setLicense("");
    setAddress("");
    setFiles({});
    setRemoved([]);
  };
  const edit = (item: BusinessApplication) => {
    setAcceptedHash("");
    setEditing(item);
    setKind(item.businessType);
    setName(item.businessName);
    setDescription(item.description);
    setLicense(item.licenseNumber || "");
    setAddress(item.address.code);
    setFiles({});
    setRemoved([]);
    setForm(true);
  };
  const active = q.data?.items.find(
    (x) =>
      x.businessType === kind &&
      ["Pending", "NeedsInfo", "VisitRequired"].includes(x.status),
  );
  const submit = () =>
    run(async () => {
      if (!name.trim() || !description.trim() || !address)
        throw new Error("نام محل فعالیت، توضیحات و نشانی الزامی است");
      if (!terms.data || acceptedHash !== terms.data.hash || terms.error) throw new Error("قوانین همکاری را مطالعه و تأیید کنید.");
      const data = new FormData();
      data.append("acceptedTerms", "true");
      data.append("termsVersion", terms.data.document.version);
      data.append("termsHash", terms.data.hash);
      data.append("businessType", kind);
      data.append("businessName", name.trim());
      data.append("description", description.trim());
      data.append("addressCode", address);
      data.append("licenseNumber", license.trim());
      if (editing) data.append("version", editing.version);
      removed.forEach((c) => data.append("removeDocumentCodes", c));
      for (const documentKind of businessDocumentKinds) {
        const file = files[documentKind];
        const existing = editing?.documents.some(doc => doc.kind === documentKind && !removed.includes(doc.code));
        if (!file && !existing && documentKind !== "Membership")
          throw new Error(`مدرک «${businessDocumentLabel(documentKind, kind)}» را انتخاب کنید.`);
        if (file) data.append(documentKind + "Document", Platform.OS === "web" && file.file
          ? file.file
          : ({ uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" } as unknown as Blob));
      }
      await businessApi.submit(data, editing?.code);
      clear();
    }, "درخواست شما برای بررسی مدیریت ارسال شد");
  const pickDocument = (documentKind: BusinessDocumentKind) => void run(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ["image/jpeg", "image/png", "image/webp", "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    });
    if (result.canceled) return;
    const picked = result.assets[0];
    if (!picked || !/\.(jpe?g|png|webp|pdf|docx|xlsx)$/i.test(picked.name) ||
        (picked.size !== undefined && (picked.size <= 0 || picked.size > 10 * 1024 * 1024)))
      throw new Error("فرمت فایل معتبر نیست یا حجم آن بیش از ۱۰ مگابایت است.");
    setFiles(current => ({ ...current, [documentKind]: picked }));
  });
  const footer = (
    <View
      style={{
        padding: 12,
        borderTopWidth: 1,
        borderColor: theme.border,
        backgroundColor: "white",
        gap: 10,
        flexDirection: "row-reverse",
      }}
    >
      {form ? (
        <>
          <Button
            style={{ flex: 2 }}
            title="ارسال برای بررسی"
            busy={busy}
            disabled={
              !address ||
              !name.trim() ||
              !description.trim() ||
              !terms.data || !!terms.error || acceptedHash !== terms.data.hash ||
              (!!active && !editing)
            }
            onPress={() => void submit()}
          />
          <Button
            style={{ flex: 1 }}
            outline
            title="انصراف"
            disabled={busy}
            onPress={clear}
          />
        </>
      ) : (
        <Button
          style={{ flex: 1 }}
          title="ثبت درخواست همکاری"
          disabled={q.isLoading || !!q.error}
          onPress={() => {
            clear();
            setForm(true);
          }}
        />
      )}
    </View>
  );
  return (
    <AuthGate>
      <MarketplaceTermsModal terms={terms.data} visible={showTerms} onClose={() => setShowTerms(false)} />
      <Screen
        key={form ? editing?.code || "new" : "list"}
        title={
          form
            ? editing
              ? "تکمیل درخواست همکاری"
              : "ثبت درخواست همکاری"
            : "درخواست همکاری"
        }
        fixedFooter={footer}
        onRefresh={() => q.refetch()}
        refreshing={q.isRefetching}
      >
        {!form && <Card style={{ backgroundColor: theme.mint, borderColor: "#D1FAE5" }}>
          <Text bold style={{ color: "#065F46" }}>
            فعالیت حرفه‌ای در الو گیاه
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 27, color: "#065F46" }}>
            کشاورز: پس از تأیید، می‌توانید مزرعه و آگهی فروش ثبت کنید.
            {"\n"}مغازه‌دار: پس از تأیید، با حساب خریدار همکار می‌توانید مستقیم با فروشندگان هماهنگ شوید.
          </Text>
          <Text muted style={{ fontSize: 11 }}>
            مدارک فقط برای خودتان و مدیریت قابل مشاهده‌اند.
          </Text>
          <Button outline title="قوانین همکاری و حریم خصوصی" onPress={() => setShowTerms(true)} disabled={!terms.data} />
        </Card>}
        <QueryState
          loading={q.isLoading}
          error={q.error}
          retry={() => q.refetch()}
        />
        {form ? (
          <Card style={{ padding: 20 }}>
            <Text bold style={{ fontSize: 16 }}>نوع همکاری را انتخاب کنید</Text>
            <View accessibilityRole="radiogroup" style={{ flexDirection: "row-reverse", gap: 10 }}>
              {roleOptions.map(role => {
                const selected = kind === role.value;
                return (
                  <Pressable key={role.value} accessibilityRole="radio" accessibilityLabel={role.title}
                    accessibilityState={{ checked: selected, disabled: !!editing || busy }}
                    disabled={!!editing || busy} onPress={() => selectRole(role.value)}
                    style={{ flex: 1, minWidth: 0, minHeight: 108, gap: 6, padding: 12, borderRadius: 16, borderWidth: 2,
                      borderColor: selected ? role.border : theme.border, backgroundColor: selected ? role.background : "white" }}>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
                      <Ionicons name={role.icon} size={22} color={role.color} />
                      {selected && <Ionicons name="checkmark-circle" size={18} color={role.color} />}
                    </View>
                    <Text bold style={{ color: role.color }}>{role.title}</Text>
                    <Text muted style={{ fontSize: 11, lineHeight: 19 }}>{role.description}</Text>
                  </Pressable>
                );
              })}
            </View>
            {editing && <Text muted style={{ fontSize: 11 }}>نوع همکاری در درخواست ثبت‌شده ثابت است.</Text>}
            <Animated.View style={{ gap: 12,
              opacity: roleTransition.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
              transform: [{ translateY: roleTransition.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
            }}>
            {active && !editing ? (
              <>
                <Text style={{ color: "#92400E" }}>
                  برای این نوع فعالیت درخواست باز دارید. وضعیت آن را در بخش
                  درخواست‌ها پیگیری کنید.
                </Text>
                {active.status === "NeedsInfo" && (
                  <Button
                    title="تکمیل درخواست قبلی"
                    onPress={() => edit(active)}
                  />
                )}
              </>
            ) : (
              <>
                <View style={{ backgroundColor: kind === "Farmer" ? "#ECFDF5" : "#FBF4E3", borderRadius: 14, padding: 12, gap: 4 }}>
                  <Text bold>{kind === "Farmer" ? "اطلاعات مزرعه و تولید" : "اطلاعات مغازه و خرید"}</Text>
                  <Text muted style={{ fontSize: 12 }}>نشانی محل فعالیت و مدارک مرتبط با این نقش را وارد کنید.</Text>
                </View>
                <Field
                  label={
                    kind === "Farmer"
                      ? "نام مزرعه یا محل تولید"
                      : "نام مغازه / فروشگاه"
                  }
                  value={name}
                  onChangeText={setName}
                  maxLength={150}
                />
                <Field
                  label="توضیحات فعالیت"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={3000}
                />
                <Text muted style={{ fontSize: 12 }}>
                  {kind === "Farmer"
                    ? "نوع تولید و سابقهٔ فعالیتتان را بنویسید."
                    : "نوع فروشگاه، کالاهای موردنیاز و میزان تقریبی خرید را بنویسید."}
                </Text>
                <QueryState
                  loading={addresses.isLoading}
                  error={addresses.error}
                  retry={() => addresses.refetch()}
                />
                <Select
                  label="نشانی محل فعالیت"
                  value={address}
                  onChange={setAddress}
                  options={
                    addresses.data?.items.map((a) => ({
                      value: a.code,
                      label: `${a.provinceName}، ${a.countyName}، ${a.street}`,
                    })) || []
                  }
                />
                <Button
                  outline
                  title="ثبت نشانی جدید محل فعالیت"
                  onPress={() => navigation.navigate("AddressForm")}
                />
                <Field
                  label="شماره جواز یا مجوز (اختیاری)"
                  value={license}
                  onChangeText={setLicense}
                  maxLength={100}
                />
                {editing?.documents.map((d) => (
                  <Button
                    key={d.code}
                    outline
                    compact
                    title={`${removed.includes(d.code) ? "بازگردانی" : "حذف در ارسال مجدد"}: ${d.name}`}
                    onPress={() =>
                      setRemoved((old) =>
                        old.includes(d.code)
                          ? old.filter((c) => c !== d.code)
                          : [...old, d.code],
                      )
                    }
                  />
                ))}
                <Text bold style={{ fontSize: 16, marginTop: 8 }}>مدارک درخواست</Text>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                  <Ionicons name="lock-closed-outline" size={16} color={theme.muted} />
                  <Text muted style={{ flex: 1, fontSize: 11, lineHeight: 20 }}>مدارک فقط برای شما و مدیران مجاز قابل مشاهده‌اند.</Text>
                </View>
                {businessDocumentKinds.map(documentKind => {
                  const file = files[documentKind];
                  const existing = editing?.documents.find(doc => doc.kind === documentKind && !removed.includes(doc.code));
                  const name = file?.name ?? existing?.name;
                  const title = businessDocumentLabel(documentKind, kind);
                  const optional = documentKind === "Membership";
                  const action = name ? "جایگزینی فایل" : "انتخاب فایل";
                  return (
                    <View key={documentKind} style={{ gap: 8, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <Text bold style={{ fontSize: 13 }}>{title}</Text>
                        <Text style={{ fontSize: 10, paddingHorizontal: 8, borderRadius: 10, color: optional ? theme.muted : "#92400E", backgroundColor: optional ? "#F1F5F9" : "#FFFBEB" }}>
                          {optional ? "اختیاری" : "الزامی"}
                        </Text>
                      </View>
                      <Pressable accessibilityRole="button" accessibilityLabel={action + "، " + title} disabled={busy} onPress={() => pickDocument(documentKind)}
                        style={({ pressed }) => ({
                          minHeight: 60, flexDirection: "row-reverse", alignItems: "center", gap: 10, padding: 10, borderRadius: 12,
                          borderWidth: 1, borderStyle: name ? "solid" : "dashed", borderColor: name ? "#A7F3D0" : "#CBD5E1",
                          backgroundColor: name ? "#ECFDF5" : "#F8FAFC", opacity: busy || pressed ? 0.65 : 1,
                        })}>
                        <Ionicons name={name ? "checkmark-circle-outline" : "cloud-upload-outline"} size={24} color={theme.green} />
                        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                          <Text bold style={{ fontSize: 12 }}>{action}</Text>
                          {name && <Text muted style={{ fontSize: 11, writingDirection: "ltr" }}>{name}</Text>}
                        </View>
                      </Pressable>
                      {file && <Pressable accessibilityRole="button" accessibilityLabel={"حذف فایل انتخابی، " + title} disabled={busy}
                        onPress={() => setFiles(current => ({ ...current, [documentKind]: undefined }))}
                        style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, minHeight: 44 }}>
                        <Ionicons name="close-outline" size={16} color={theme.danger} />
                        <Text style={{ fontSize: 11, color: theme.danger }}>حذف فایل انتخابی</Text>
                      </Pressable>}
                    </View>
                  );
                })}
                <Text muted style={{ fontSize: 11, lineHeight: 23 }}>
                  هر فایل تا ۱۰ مگابایت. تصویر، PDF، DOCX و XLSX پذیرفته می‌شود.
                </Text>
                <View style={{ marginTop: 16, gap: 12, padding: 16, borderRadius: 16, backgroundColor: "#ECFDF5" }}>
                  <Text bold>مطالعه و پذیرش قوانین همکاری</Text>
                  <QueryState loading={terms.isLoading} error={terms.error} retry={() => terms.refetch()} />
                  <Button outline title="مطالعه کامل قوانین" disabled={!terms.data} onPress={() => setShowTerms(true)} />
                  {terms.data && <><Text muted>نسخه {terms.data.document.version} · تعهدات {kind === "Farmer" ? "کشاورز و فروشنده" : "خریدار همکار"}</Text><Pressable accessibilityRole="checkbox" accessibilityLabel="قوانین همکاری و حریم خصوصی را مطالعه کردم و با شرایط نقش انتخابی موافقم" accessibilityState={{ checked: acceptedHash === terms.data.hash, disabled: busy }} disabled={busy} onPress={() => setAcceptedHash(v => v === terms.data!.hash ? "" : terms.data!.hash)} style={{ padding: 12, borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 12 }}><Text>{acceptedHash === terms.data.hash ? "☑" : "☐"} قوانین همکاری و حریم خصوصی را مطالعه کردم و با شرایط نقش انتخابی موافقم.</Text></Pressable></>}
                </View>
              </>
            )}
            </Animated.View>
          </Card>
        ) : (
          <>
            {!q.isLoading && !q.error && !q.data?.items.length && (
              <Card>
                <Text muted>هنوز درخواست همکاری ثبت نکرده‌اید.</Text>
              </Card>
            )}
            {q.data?.items.map((item) => (
              <Card key={item.code} style={{ padding: 20, gap: 14 }}>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <Text bold style={{ flex: 1 }}>
                    {item.businessName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color:
                        item.status === "Approved"
                          ? "#047857"
                          : item.status === "Rejected"
                            ? "#BE123C"
                            : "#92400E",
                      backgroundColor:
                        item.status === "Approved"
                          ? theme.mint
                          : item.status === "Rejected"
                            ? "#FFF1F2"
                            : "#FFFBEB",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 20,
                    }}
                  >
                    {businessStatuses[item.status]}
                  </Text>
                </View>
                <Text muted style={{ fontSize: 12 }}>
                  {businessTypes[item.businessType]} · {date(item.createdAt)}
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 27 }}>
                  {item.description}
                </Text>
                <View
                  style={{
                    padding: 12,
                    backgroundColor: theme.bg,
                    borderRadius: 12,
                  }}
                >
                  <Text muted style={{ fontSize: 12, lineHeight: 25 }}>
                    نشانی محل فعالیت: {item.address.province}،{" "}
                    {item.address.county}،{" "}
                    {item.address.city || item.address.village}،{" "}
                    {item.address.street}
                    {"\n"}کد پستی: {item.address.postalCode}
                  </Text>
                </View>
                {!!item.licenseNumber && (
                  <Text style={{ fontSize: 12 }}>
                    شماره جواز: {item.licenseNumber}
                  </Text>
                )}
                {!!item.reviewNote && (
                  <Text
                    style={{
                      padding: 12,
                      backgroundColor: "#FFFBEB",
                      borderRadius: 12,
                      color: "#92400E",
                      fontSize: 13,
                      lineHeight: 27,
                    }}
                  >
                    پاسخ مدیریت: {item.reviewNote}
                  </Text>
                )}
                {!!item.visitAt && (
                  <Text style={{ fontSize: 12 }}>
                    زمان بازدید: {date(item.visitAt)}
                    {item.visitedAt ? " · بازدید انجام شد" : ""}
                  </Text>
                )}
                {!!item.visitNote && (
                  <Text style={{ fontSize: 13 }}>
                    نتیجه بازدید: {item.visitNote}
                  </Text>
                )}
                {item.documents.map((doc) => (
                  <BusinessDownload key={doc.code} item={item} doc={doc} />
                ))}
                {item.status === "NeedsInfo" && (
                  <Button
                    title="تکمیل اطلاعات و ارسال مجدد"
                    onPress={() => edit(item)}
                  />
                )}
                {item.status === "Approved" && (
                  <>
                    <Text style={{ color: "#047857", fontSize: 13 }}>
                      {item.businessType === "Farmer"
                        ? "دسترسی کشاورز فعال شد."
                        : "حساب خریدار همکار تأیید شد. برای هماهنگی خرید می‌توانید با فروشندگان گفت‌وگو کنید."}
                    </Text>
                    {item.businessType === "Farmer" && (
                      <Button
                        outline
                        title="مزرعه‌های من"
                        onPress={() => navigation.navigate("MyFarms")}
                      />
                    )}
                  </>
                )}
                <History item={item} />
              </Card>
            ))}
            <Button
              outline
              title="به‌روزرسانی وضعیت و دسترسی‌ها"
              busy={busy}
              onPress={() => void run(() => q.refetch())}
            />
          </>
        )}
      </Screen>
    </AuthGate>
  );
}
function History({ item }: { item: BusinessApplication }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={{ fontSize: 12, color: theme.green }}>
          تاریخچه درخواست {open ? "⌃" : "⌄"}
        </Text>
      </Pressable>
      {open &&
        item.history.map((h, i) => (
          <View
            key={i}
            style={{
              borderRightWidth: 2,
              borderColor: "#D1FAE5",
              padding: 12,
              marginTop: 8,
            }}
          >
            <Text bold style={{ fontSize: 12 }}>
              {businessActions[h.action] || h.action}
            </Text>
            <Text muted style={{ fontSize: 11 }}>
              {date(h.at)}
            </Text>
            <Text style={{ fontSize: 12 }}>{h.note}</Text>
          </View>
        ))}
    </View>
  );
}
function BusinessDownload({
  item,
  doc,
}: {
  item: BusinessApplication;
  doc: BusinessDocument;
}) {
  const { busy, run } = useAction();
  return (
    <Button
      outline
      compact
      title={`📎 ${businessDocumentLabel(doc.kind, item.businessType)} · ${doc.name}`}
      busy={busy}
      onPress={() =>
        void run(async () => {
          const bytes = await businessApi.download(item.code, doc.code);
          if (Platform.OS === "web") {
            const url = URL.createObjectURL(
                new Blob([bytes], { type: doc.contentType }),
              ),
              a = document.createElement("a");
            a.href = url;
            a.download = doc.name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          } else {
            if (!(await Sharing.isAvailableAsync()))
              throw new Error("بازکردن فایل روی این دستگاه در دسترس نیست");
            const safe = doc.name.replace(/[^\p{L}\p{N}._-]/gu, "_");
            const filename =
              safe.length > 80
                ? safe.slice(0, 64) + "." + safe.split(".").pop()
                : safe;
            const file = new File(
              Paths.cache,
              `business-${doc.code.slice(0, 8)}-${filename}`,
            );
            file.write(new Uint8Array(bytes));
            await Sharing.shareAsync(file.uri, {
              mimeType: doc.contentType,
              dialogTitle: doc.name,
            });
          }
        })
      }
    />
  );
}
