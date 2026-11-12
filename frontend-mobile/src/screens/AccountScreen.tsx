import { useProductColumns } from "../shared/hooks/useProductColumns";
import { AppModal as Modal } from "../design-system/molecules/AppModal";
import { appAlert as Alert } from "../shared/alerts";
import { PushSettings } from "../design-system/organisms/PushSettings";
import React, { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ServiceGrid,
  type ServiceTile,
} from "../design-system/molecules/ServiceGrid";
import { View, Pressable, Switch, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api/mobile";
import { businessApi } from "../api/business";
import { SettlementsPanel } from "../design-system/organisms/SettlementsPanel";
import { request } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { ProfileContactField } from "../design-system/molecules/ProfileContactField";
import { ProfileSummary } from "../design-system/molecules/ProfileSummary";
import { ProductCard } from "../design-system/molecules/ProductCard";
import { QueryState } from "../design-system/molecules/QueryState";
import { useAuth, useProfile } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { money, date, quantity } from "../shared/utils/format";
import { saleDigits } from "../shared/utils/sale-units";
import { useRoles } from "../shared/hooks/useRoles";
import { theme } from "../shared/theme";
import type { Routes, Props } from "../navigation/types";
export function AccountScreen() {
  const nav = useNavigation<NativeStackNavigationProp<Routes>>();
  const auth = useAuth();
  const profile = useProfile();
  const roles = useRoles();
  const tile = (
    route: keyof Routes,
    label: string,
    icon: ServiceTile["icon"],
  ): ServiceTile => ({
    label,
    icon,
    onPress: () => nav.navigate(route as never),
  });
  return (
    <AuthGate>
      <Screen>
        <Card
          style={{
            backgroundColor: theme.mint,
            padding: 22,
            borderColor: "#D1FAE5",
            borderRadius: 24,
            marginBottom: 26,
          }}
        >
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.green, fontSize: 11 }}>
                الو گیاه / داشبورد
              </Text>
              <Text bold style={{ fontSize: 23, lineHeight: 36, marginTop: 6 }}>
                {profile.data?.user?.fName
                  ? `${profile.data.user.fName}، خوش آمدید`
                  : "به داشبورد خوش آمدید"}
              </Text>
              <Text muted style={{ fontSize: 12, marginTop: 6 }}>
                امروز چه کاری می‌خواهید انجام دهید؟
              </Text>
            </View>
            <View
              accessible={false}
              style={{
                backgroundColor: "white",
                width: 56,
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person-outline" size={26} color={theme.green} />
            </View>
          </View>
        </Card>
        <QueryState
          loading={profile.isLoading}
          error={profile.error}
          retry={() => profile.refetch()}
        />
        <ServiceGrid
          title="آگهی و هماهنگی"
          items={[
            tile("Inquiries", "درخواست‌های خرید", "paper-plane-outline"),
            tile("Saved", "ذخیره‌ها", "bookmark-outline"),
            tile("Chat", "گفت‌وگوها", "chatbubble-outline"),
          ]}
        />
        <ServiceGrid
          title="محتوا و مزارع"
          color="#0369A1"
          background="#F0F9FF"
          items={[
            tile("Articles", "مقالات", "book-outline"),
            tile("Farms", "مزارع", "map-outline"),
          ]}
        />
        {roles.has("Farmer") && (
          <ServiceGrid
            title="مزرعه‌های من"
            color="#B45309"
            background="#FFFBEB"
            items={[
              tile("MyFarms", "مزرعه‌های من", "leaf-outline"),
              tile("FarmForm", "ثبت مزرعه", "add-circle-outline"),
            ]}
          />
        )}
        <ServiceGrid
          title="حساب من"
          color="#6D28D9"
          background="#F5F3FF"
          items={[
            tile("ProfileEdit", "حساب کاربری", "person-outline"),
            tile("Business", "درخواست همکاری", "business-outline"),
            tile(
              "NotificationPreferences",
              "اعلان‌ها",
              "notifications-outline",
            ),
          ]}
        />
        <Button
          title="مشاهدهٔ آگهی‌ها"
          onPress={() => nav.navigate("Tabs", { screen: "Catalog" })}
        />
        <Button
          outline
          style={{ marginTop: 12 }}
          title="خروج از حساب"
          onPress={() =>
            Alert.alert("خروج", "از حساب خارج شوید؟", [
              { text: "انصراف", style: "cancel" },
              { text: "خروج", onPress: () => auth.logout() },
            ])
          }
        />
      </Screen>
    </AuthGate>
  );
}
function AccountLogoutButton() {
  const auth = useAuth();
  const { busy, run } = useAction();
  return (
    <Button
      outline
      busy={busy}
      title="خروج از حساب کاربری"
      icon={<Ionicons name="log-out-outline" size={22} color={theme.danger} />}
      style={{
        marginHorizontal: 16,
        marginBottom: 20,
        borderColor: "#FECACA",
        backgroundColor: "#FFF1F2",
      }}
      onPress={() =>
        Alert.alert("خروج از حساب", "آیا می‌خواهید از حساب کاربری خارج شوید؟", [
          { text: "انصراف", style: "cancel" },
          {
            text: "خروج",
            style: "destructive",
            onPress: () => void run(() => auth.logout()),
          },
        ])
      }
    />
  );
}
const accountPanelStyle = {
  padding: 20,
  borderRadius: 16,
  marginBottom: 24,
  marginHorizontal: 16,
  gap: 8,
};
const accountActionStyle = {
  alignSelf: "flex-end" as const,
  minHeight: 44,
  paddingVertical: 10,
  backgroundColor: "#047857",
  borderColor: "#047857",
};

export function ProfileEditScreen() {
  const q = useProfile();
  const navigation = useNavigation<NativeStackNavigationProp<Routes>>();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { busy, run } = useAction();
  const savedFirst = q.data?.user?.fName;
  const savedLast = q.data?.user?.lName;
  const savedEmail = q.data?.user?.email;
  const savedPhone = q.data?.user?.phoneNumber;
  useEffect(() => {
    setFirst(savedFirst || "");
    setLast(savedLast || "");
    setEmail(savedEmail || "");
    setPhone(savedPhone || "");
  }, [savedFirst, savedLast, savedEmail, savedPhone]);
  const editPhoto = () =>
    run(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const photo = result.assets[0];
      await api.upload("/User/UploadProfileImage", "File", {
        uri: photo.uri,
        name: photo.fileName || "profile.jpg",
        type: photo.mimeType || "image/jpeg",
      });
    }, "عکس بارگذاری شد");
  return (
    <AuthGate>
      <Screen>
        <QueryState
          loading={q.isLoading}
          error={q.error}
          retry={() => q.refetch()}
        />
        {q.data?.user && (
          <ProfileSummary
            user={q.data.user}
            busy={busy}
            onEditPhoto={() => void editPhoto()}
          />
        )}
        <AccountLogoutButton />
        <Card style={accountPanelStyle}>
          <Text bold style={{ fontSize: 18 }}>
            اطلاعات حساب
          </Text>
          <Field
            label="نام"
            value={first}
            onChangeText={setFirst}
            icon={
              <Ionicons name="person-outline" size={24} color={theme.muted} />
            }
          />
          <Field
            label="نام خانوادگی"
            value={last}
            onChangeText={setLast}
            icon={
              <Ionicons name="create-outline" size={24} color={theme.muted} />
            }
          />
          <ProfileContactField key={`email:${savedEmail ?? ""}`} kind="email" savedValue={savedEmail || ""}
            confirmed={q.data?.user?.isEmailConfirmed === true} saving={busy} value={email} onChange={setEmail} />
          <ProfileContactField key={`phone:${savedPhone ?? ""}`} kind="phone" savedValue={savedPhone || ""}
            confirmed={q.data?.user?.isPhoneConfirmed === true} saving={busy} value={phone}
            onChange={setPhone} editable={q.data?.user?.isPhoneOnly !== true} />
          <Button
            busy={busy}
            style={accountActionStyle}
            title="ذخیرهٔ تغییرات"
            onPress={() =>
              run(async () => {
                if (!first.trim() || !last.trim())
                  throw new Error("نام و نام خانوادگی الزامی است");
                await api.updateProfile({
                  fName: first,
                  lName: last,
                  email: email.trim() || null,
                  phoneNumber: saleDigits(phone.trim()) || null,
                });
              }, "اطلاعات حساب ذخیره شد")
            }
          />
        </Card>
        <AccountSecurityFields phoneOnly={q.data?.user?.isPhoneOnly === true} phoneNumber={savedPhone || ""} />
        <Card style={accountPanelStyle}>
          <Text bold>درخواست همکاری</Text>
          <Text muted>برای فعالیت به‌عنوان کشاورز یا مغازه‌دار، مدارک را ارسال کنید یا وضعیت درخواستتان را ببینید.</Text>
          <Button outline title="ثبت و پیگیری درخواست" onPress={() => navigation.navigate("Business")} />
        </Card>
        <AccountPrivacyActions />
      </Screen>
    </AuthGate>
  );
}
function AccountPrivacyActions() {
  const auth = useAuth();
  const { busy, run } = useAction();
  const { data } = useQuery({ queryKey: ["marketplace-terms"], queryFn: businessApi.terms });
  const support = data?.operator;
  return (
    <Card style={accountPanelStyle}>
      <Text bold>حریم خصوصی و پشتیبانی</Text>
      <Button outline title="سیاست حریم خصوصی و راه‌های تماس" onPress={() => void run(() => WebBrowser.openBrowserAsync("https://aloogiyah.ir/privacy"))} />
      {!!support?.email && <Button outline title={`ایمیل پشتیبانی ${support.email}`} onPress={() => void run(() => ExpoLinking.openURL(`mailto:${support.email}`))} />}
      {!!support?.phone && <Button outline title={`تماس با پشتیبانی ${support.phone}`} onPress={() => void run(() => ExpoLinking.openURL(`tel:${support.phone}`))} />}
      <Text muted>با حذف حساب، دسترسی شما و آگهی‌هایتان حذف می‌شود. برخی سوابق ضروری تراکنش ممکن است حفظ شوند.</Text>
      <Button outline busy={busy} title="حذف حساب کاربری"
        icon={<Ionicons name="trash-outline" size={18} color={theme.danger} />}
        style={{ borderColor: "#FECACA", backgroundColor: "#FFF1F2" }}
        onPress={() => Alert.alert("حذف دائمی حساب", "حساب، پروفایل، آگهی‌ها و پیام‌های ارسالی شما حذف می‌شوند. این عمل قابل بازگشت نیست.", [
          { text: "انصراف", style: "cancel" },
          { text: "حذف دائمی حساب", style: "destructive", onPress: () => void run(async () => {
            await request<boolean>("/User/Account", { method: "DELETE" });
            await auth.logout();
          }, "حساب کاربری حذف شد") },
        ])} />
    </Card>
  );
}
export function WalletScreen() {
  const capabilities = useQuery({
    queryKey: ["payment-capabilities"],
    queryFn: api.paymentCapabilities,
    enabled: useAuth().signedIn,
  });
  const q = useQuery({
    queryKey: ["wallet"],
    queryFn: api.wallet,
    enabled: useAuth().signedIn,
  });
  const [amount, setAmount] = useState("");
  const { busy, run } = useAction();
  return (
    <AuthGate>
      <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
        <SettlementsPanel />
        <QueryState
          loading={q.isLoading}
          error={q.error}
          retry={() => q.refetch()}
        />
        {q.data && (
          <Card style={{ backgroundColor: theme.mint }}>
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: theme.green,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="wallet-outline"
                  size={26}
                  color="white"
                  accessible={false}
                />
              </View>
              <Text bold style={{ flex: 1, fontSize: 22, lineHeight: 34 }}>
                کیف پول الو گیاه
              </Text>
            </View>
            <Text bold>موجودی آزاد: {money(q.data.availableBalance)}</Text>
            <Text>رزرو شده: {money(q.data.heldAmount)}</Text>
            <Text>موجودی کل: {money(q.data.balance)}</Text>
          </Card>
        )}
        {capabilities.data?.onlinePaymentAvailable ? (
          <Card>
            <Field
              label="مبلغ شارژ به تومان"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Button
              busy={busy}
              title="ادامه به درگاه پرداخت"
              onPress={() =>
                run(async () => {
                  const n = quantity(amount);
                  if (!Number.isFinite(n) || n <= 0)
                    throw new Error("مبلغ مثبت وارد کنید");
                  const result = await api.deposit(
                    n,
                    ExpoLinking.createURL("wallet-return"),
                  );
                  if (!/^https?:\/\//i.test(result.paymentUrl))
                    throw new Error("آدرس درگاه معتبر نیست");
                  await WebBrowser.openBrowserAsync(result.paymentUrl);
                  await q.refetch();
                })
              }
            />
            <Text muted style={{ fontSize: 12 }}>
              موجودی پس از تأیید پرداخت توسط سرور به‌روز می‌شود.
            </Text>
          </Card>
        ) : (
          <Card>
            <Text bold>شارژ آنلاین فعلاً فعال نیست</Text>
            <Text>
              می‌توانید با موجودی فعلی خرید کنید. درخواست تسویه درآمد فروش و ثبت
              واریز توسط مدیریت در دسترس است.
            </Text>
            {capabilities.error && (
              <Button
                outline
                title="بررسی دوباره وضعیت پرداخت"
                onPress={() => void capabilities.refetch()}
              />
            )}
          </Card>
        )}
      </Screen>
    </AuthGate>
  );
}
function NotificationPreferences() {
  const preferences = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () =>
      request<{
        orderNotificationsEnabled: boolean;
        serviceRequestNotificationsEnabled: boolean;
        generalNotificationsEnabled: boolean;
      }>("/Notification/MyPreferences"),
    enabled: useAuth().signedIn,
  });
  const { busy, run } = useAction();
  return (
    <Card>
      <Text bold>تنظیمات اعلان‌ها</Text>
      <QueryState
        loading={preferences.isLoading}
        error={preferences.error}
        retry={() => preferences.refetch()}
      />
      {preferences.data &&
        Object.entries(preferences.data).map(([key, value]) => (
          <View
            key={key}
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text>
              {
                (
                  {
                    orderNotificationsEnabled: "اعلان سفارش",
                    serviceRequestNotificationsEnabled: "اعلان خدمات",
                    generalNotificationsEnabled: "اعلان عمومی",
                  } as Record<string, string>
                )[key]
              }
            </Text>
            <Switch
              disabled={busy}
              value={value}
              onValueChange={(on) =>
                run(() =>
                  request("/Notification/MyPreferences", {
                    method: "PUT",
                    data: { ...preferences.data, [key]: on },
                  }),
                )
              }
            />
          </View>
        ))}
    </Card>
  );
}

export function NotificationPreferencesScreen() {
  return (
    <AuthGate>
      <Screen title="تنظیمات اعلان‌ها">
        <PushSettings />
        <NotificationPreferences />
      </Screen>
    </AuthGate>
  );
}

export function NotificationsScreen() {
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications,
    enabled: useAuth().signedIn,
  });
  const nav = useNavigation<NativeStackNavigationProp<Routes>>();
  type Notice = Awaited<ReturnType<typeof api.notifications>>[number];
  const [selected, setSelected] = useState<Notice | null>(null);
  const { busy, run } = useAction();
  const openNotice = (notice: Notice) => {
    setSelected(notice);
    if (!notice.isRead) void run(() => api.readNotice(notice.code));
  };
  const removeNotice = (notice: Notice) =>
    run(async () => {
      await api.deleteNotice(notice.code);
      setSelected((current) =>
        current?.code === notice.code ? null : current,
      );
    });
  const action =
    selected && /^(ProductInquiry|درخواست خرید)/.test(selected.type.trim())
      ? { route: "Inquiries" as const, label: "دیدن درخواست‌های خرید" }
      :
    selected &&
    /^(Order|FarmOrder|Checkout|سفارش|خرید)/.test(selected.type.trim())
      ? { route: "Orders" as const, label: "رفتن به صفحه سفارشات" }
      : selected && /^(ServiceRequest|درخواست خدمات)/.test(selected.type.trim())
        ? { route: "Services" as const, label: "رفتن به صفحه درخواست خدمات" }
        : null;
  const unread = q.data?.filter((notice) => !notice.isRead).length ?? 0;
  return (
    <AuthGate>
      <Screen onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
        <Card style={{ flexDirection: "row-reverse", alignItems: "center" }}>
          <View
            style={{
              backgroundColor: theme.mint,
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={theme.green}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text bold>اعلان‌ها</Text>
            {q.data && (
              <Text muted style={{ fontSize: 12 }}>
                {unread
                  ? `${unread.toLocaleString("fa-IR")} اعلان خوانده‌نشده`
                  : "همه اعلان‌ها خوانده شده‌اند"}
              </Text>
            )}
          </View>
        </Card>
        <QueryState
          loading={q.isLoading}
          error={q.error}
          empty={q.data?.length === 0}
          retry={() => q.refetch()}
        />
        {q.data?.map((n) => (
          <Card
            key={n.code}
            style={{
              flexDirection: "row-reverse",
              alignItems: "flex-start",
              padding: 12,
              borderRadius: 12,
              borderColor: n.isRead ? "#F1F5F9" : "#D1FAE5",
              backgroundColor: n.isRead ? "white" : theme.mint,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${n.isRead ? "خوانده‌شده" : "خوانده‌نشده"}: ${n.type.trim() || "اعلان جدید"}`}
              disabled={busy}
              onPress={() => openNotice(n)}
              style={{ flex: 1, flexDirection: "row-reverse", gap: 12 }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  marginTop: 8,
                  borderRadius: 5,
                  backgroundColor: n.isRead ? theme.border : theme.accent,
                }}
              />
              <View style={{ flex: 1, gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Text
                    bold={!n.isRead}
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: 14 }}
                  >
                    {n.type.trim() || "اعلان جدید"}
                  </Text>
                  {!n.isRead && (
                    <Text
                      bold
                      style={{
                        fontSize: 10,
                        color: theme.green,
                        backgroundColor: "#D1FAE5",
                        borderRadius: 12,
                        paddingHorizontal: 8,
                      }}
                    >
                      جدید
                    </Text>
                  )}
                </View>
                <Text
                  muted
                  numberOfLines={2}
                  style={{ fontSize: 12, lineHeight: 24 }}
                >
                  {n.message}
                </Text>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons name="time-outline" size={12} color={theme.muted} />
                  <Text muted style={{ fontSize: 10 }}>
                    {date(n.createdAt)}
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="حذف اعلان"
              disabled={busy}
              onPress={() => void removeNotice(n)}
              style={{
                minWidth: 44,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trash-outline" size={18} color={theme.muted} />
            </Pressable>
          </Card>
        ))}
        <Modal
          visible={!!selected}
          transparent
          animationType="fade"
          onRequestClose={() => setSelected(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(2,6,23,0.4)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <Pressable
              accessibilityLabel="بستن جزئیات اعلان"
              accessibilityRole="button"
              onPress={() => setSelected(null)}
              style={{ position: "absolute", inset: 0 }}
            />
            {selected && (
              <Card
                accessibilityViewIsModal
                style={{
                  width: "100%",
                  maxWidth: 512,
                  maxHeight: "85%",
                  alignSelf: "center",
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 12,
                    borderBottomWidth: 1,
                    borderColor: "#F1F5F9",
                    paddingBottom: 12,
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={theme.green}
                  />
                  <View style={{ flex: 1 }}>
                    <Text bold>{selected.type.trim() || "اعلان جدید"}</Text>
                    <Text muted style={{ fontSize: 11 }}>
                      {date(selected.createdAt)}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="بستن جزئیات اعلان"
                    onPress={() => setSelected(null)}
                    style={{
                      minHeight: 44,
                      justifyContent: "center",
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text muted>بستن ×</Text>
                  </Pressable>
                </View>
                <ScrollView style={{ flexShrink: 1 }}>
                  <Text style={{ lineHeight: 30, paddingVertical: 12 }}>
                    {selected.message}
                  </Text>
                </ScrollView>
                {action && (
                  <Button
                    title={action.label}
                    onPress={() => {
                      setSelected(null);
                      nav.navigate(action.route);
                    }}
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="حذف اعلان"
                  disabled={busy}
                  onPress={() => void removeNotice(selected)}
                  style={{
                    flexDirection: "row-reverse",
                    gap: 8,
                    alignItems: "center",
                    minHeight: 44,
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.danger}
                  />
                  <Text style={{ color: theme.danger }}>حذف اعلان</Text>
                </Pressable>
              </Card>
            )}
          </View>
        </Modal>
      </Screen>
    </AuthGate>
  );
}
export function SavedScreen({ navigation }: Props<"Saved">) {
  const columns = useProductColumns();
  const q = useQuery({
    queryKey: ["saved"],
    queryFn: api.saved,
    enabled: useAuth().signedIn,
  });
  return (
    <AuthGate>
      <Screen>
        <QueryState
          loading={q.isLoading}
          error={q.error}
          empty={q.data?.length === 0}
          retry={() => q.refetch()}
        />
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap" }}>
          {q.data?.map((p) => (
            <View
              key={p.code}
              style={{ width: columns === 1 ? "100%" : "50%" }}
            >
              <ProductCard
                product={p}
                onPress={() => navigation.navigate("Product", { code: p.code })}
              />
            </View>
          ))}
        </View>
      </Screen>
    </AuthGate>
  );
}
export { RewardsScreen } from "./RewardsScreen";

function AccountSecurityFields({ phoneOnly, phoneNumber }: {
  phoneOnly: boolean;
  phoneNumber: string;
}) {
  const auth = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<Routes>>();
  const [currentUser, setCurrentUser] = useState("");
  const [newUser, setNewUser] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [old, setOld] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [challenge, setChallenge] = useState<{ challengeCode: string; testCode?: string }>();
  const [setupCode, setSetupCode] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const { busy, run } = useAction();
  return (
    <>
      {phoneOnly ? (
        <Card style={accountPanelStyle}>
          <Text bold style={{ fontSize: 18 }}>امنیت ورود</Text>
          <Text muted>روش ورود شما شمارهٔ موبایل و کد پیامکی است. در صورت تمایل، ورود با نام کاربری و رمز را هم فعال کنید.</Text>
          <Button outline busy={busy} disabled={!phoneNumber} title={challenge ? "ارسال دوبارهٔ کد" : "فعال‌کردن ورود با رمز"}
            onPress={() => void run(async () => {
              const result = await request<{ challengeCode: string; testCode?: string }>("/Auth/RequestPhoneCode", {
                method: "POST", data: { phoneNumber, purpose: "PasswordSetup" },
              });
              setChallenge(result);
              setSetupCode("");
            }, "کد تأیید ارسال شد.")} />
          {challenge && <>
            {challenge.testCode && <Text muted>کد آزمایشی {challenge.testCode}</Text>}
            <Field label="کد پیامکی" keyboardType="number-pad" maxLength={6} value={setupCode} onChangeText={setSetupCode} />
            <Field label="نام کاربری دلخواه" autoCapitalize="none" maxLength={50} value={setupUsername} onChangeText={setSetupUsername} />
            <Field label="رمز دلخواه" secureTextEntry maxLength={72} value={setupPassword} onChangeText={setSetupPassword} />
            <Button busy={busy} title="تأیید و فعال‌سازی" onPress={() => void run(async () => {
              await request("/Auth/SetPhoneCredentials", {
                method: "POST", data: { challengeCode: challenge.challengeCode, code: saleDigits(setupCode), username: setupUsername.trim(), password: setupPassword },
              });
              await auth.logout();
              navigation.navigate("Login");
            }, "ورود با رمز فعال شد. دوباره وارد حساب شوید.")} />
          </>}
        </Card>
      ) : <Card style={accountPanelStyle}>
        <Text bold style={{ fontSize: 18 }}>
          تغییر رمز عبور
        </Text>
        <Text muted style={{ fontSize: 12 }}>
          پس از تغییر رمز عبور، لازم است دوباره وارد حساب شوید.
        </Text>
        <Field
          label="رمز فعلی"
          secureTextEntry
          value={old}
          onChangeText={setOld}
        />
        <Field
          label="رمز جدید"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Text muted style={{ fontSize: 12 }}>
          حداقل ۸ کاراکتر، شامل حرف بزرگ و کوچک انگلیسی، عدد و یکی از نشانه‌های
          @$!%*?&
        </Text>
        <Field
          label="تکرار رمز جدید"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
        <Button
          busy={busy}
          style={accountActionStyle}
          title="تغییر رمز"
          onPress={() =>
            run(async () => {
              if (!old || password.length < 8 || password !== confirm)
                throw new Error("رمز جدید حداقل ۸ حرف و تکرارش یکسان باشد");
              if (
                !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,100}$/.test(
                  password,
                )
              )
                throw new Error(
                  "رمز جدید باید شامل حرف بزرگ و کوچک انگلیسی، عدد و نشانه باشد.",
                );
              await request("/Auth/ChangePassword", {
                method: "PATCH",
                data: {
                  currentPassword: old,
                  newPassword: password,
                  confirmPassword: confirm,
                },
              });
              setOld("");
              setPassword("");
              setConfirm("");
              await auth.logout();
              navigation.navigate("Login");
            }, "رمز تغییر کرد. با رمز جدید وارد شوید.")
          }
        />
      </Card>}
      {!phoneOnly && <Card style={accountPanelStyle}>
        <Text bold style={{ fontSize: 18 }}>
          تغییر نام کاربری
        </Text>
        <Field
          label="نام کاربری فعلی"
          value={currentUser}
          onChangeText={setCurrentUser}
        />
        <Field
          label="نام کاربری جدید"
          value={newUser}
          onChangeText={setNewUser}
        />
        <Field
          label="رمز عبور برای تغییر نام کاربری"
          value={usernamePassword}
          onChangeText={setUsernamePassword}
          secureTextEntry
        />
        <Button
          busy={busy}
          style={accountActionStyle}
          title="تغییر نام کاربری"
          onPress={() =>
            run(async () => {
              if (!currentUser || newUser.length < 5 || !usernamePassword)
                throw new Error(
                  "اطلاعات کامل و نام کاربری جدید حداقل ۵ حرف باشد",
                );
              await request("/Auth/ChangeUsername", {
                method: "PATCH",
                data: {
                  currentUsername: currentUser,
                  newUsername: newUser,
                  password: usernamePassword,
                },
              });
              setCurrentUser(newUser.trim());
              setNewUser("");
              setUsernamePassword("");
            }, "نام کاربری تغییر کرد")
          }
        />
      </Card>}
    </>
  );
}

export function SecurityScreen() {
  return <ProfileEditScreen />;
}
