const development = typeof __DEV__ === "undefined" || __DEV__;
export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL || (development ? "http://10.0.2.2:5056/api" : "")
).replace(/\/+$/, "");
if (!API_BASE || (!development && !/^https:\/\//i.test(API_BASE)))
  throw new Error("نشانی HTTPS سرور باید در EXPO_PUBLIC_API_URL تنظیم شود.");
export const MEDIA_BASE = (
  process.env.EXPO_PUBLIC_MEDIA_URL || API_BASE.replace(/\/api$/i, "")
).replace(/\/+$/, "");
if (!development && !/^https:\/\//i.test(MEDIA_BASE))
  throw new Error("نشانی فایل‌ها در نسخه انتشار باید HTTPS باشد.");
export const SOCKET_BASE = (
  process.env.EXPO_PUBLIC_CHAT_URL ||
  `${API_BASE.replace(/\/api$/i, "")}/ws/chat`
).replace(/^http/i, "ws");
if (!development && !/^wss:\/\//i.test(SOCKET_BASE))
  throw new Error("نشانی گفت‌وگو در نسخه انتشار باید WSS باشد.");
