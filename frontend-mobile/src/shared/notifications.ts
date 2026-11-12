import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import * as Storage from "../api/credentialStorage";
import { request } from "../api/platform";

let registeredToken: string | undefined;
export async function notificationModule() {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") return null;
  const notifications = await import("expo-notifications");
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: AppState.currentState !== "active",
      shouldShowList: AppState.currentState !== "active",
      shouldPlaySound: AppState.currentState !== "active",
      shouldSetBadge: false,
    }),
  });
  return notifications;
}
export async function registerPush(ask: boolean): Promise<string> {
  if (!ask && (await Storage.getItemAsync("aloogiyah.push-enabled")) !== "true")
    return "اعلان گوشی غیرفعال است";
  const notifications = await notificationModule();
  if (!notifications)
    return "اعلان گوشی در نسخه نصب‌شدنی اپ فعال می‌شود؛ در Expo Go یا نسخه وب در دسترس نیست.";
  if (Platform.OS === "android")
    await notifications.setNotificationChannelAsync("chat", {
      name: "پیام‌های گفتگو",
      importance: notifications.AndroidImportance.HIGH,
      lightColor: "#19915C",
      vibrationPattern: [0, 200, 150, 200],
    });
  const permission = ask
    ? await notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      })
    : await notifications.getPermissionsAsync();
  if (!permission.granted)
    return "مجوز اعلان گوشی فعال نیست؛ می‌توانید آن را در تنظیمات گوشی فعال کنید.";
  await Storage.setItemAsync("aloogiyah.push-enabled", "true");
  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("شناسه پروژه ارسال اعلان تنظیم نشده است");
  const token = (await notifications.getExpoPushTokenAsync({ projectId })).data;
  const previousToken = await Storage.getItemAsync("aloogiyah.push-token");
  if (previousToken && previousToken !== token)
    await request("/Push/Unregister", {
      method: "POST",
      data: { token: previousToken },
    });
  const result = await request<{ enabled: boolean }>("/Push/Register", {
    method: "POST",
    data: { token },
  });
  registeredToken = token;
  await Storage.setItemAsync("aloogiyah.push-token", token);
  return result.enabled
    ? "اعلان پیام روی این گوشی فعال است"
    : "مجوز گوشی فعال است؛ سرویس ارسال سرور هنوز فعال نشده است.";
}
export async function unregisterPush(disable = false) {
  const token =
    registeredToken || (await Storage.getItemAsync("aloogiyah.push-token"));
  if (token)
    await request("/Push/Unregister", { method: "POST", data: { token } });
  registeredToken = undefined;
  await Storage.deleteItemAsync("aloogiyah.push-token");
  if (disable) await Storage.setItemAsync("aloogiyah.push-enabled", "false");
  const notifications = await notificationModule();
  await notifications?.dismissAllNotificationsAsync();
}
