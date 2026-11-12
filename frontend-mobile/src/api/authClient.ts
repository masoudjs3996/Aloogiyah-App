import { create } from "axios";
import type { Tokens } from "../shared/types/mobile";
export interface CredentialStore {
  load(): Promise<void>;
  get(): Tokens | null;
  generation(): number;
  guest(): string | null;
  setGuest(token: string): Promise<void>;
  set(tokens: Tokens | null, mode?: "refresh"): Promise<void>;
  accountGeneration(): number;
}
export const bearer = (token: string) =>
  `Bearer ${token.replace(/^\s*Bearer\s+/i, "").trim()}`;
export function createAuthClient(baseURL: string, store: CredentialStore) {
  const raw = create({ baseURL, timeout: 20000 });
  let guestFlight: Promise<string> | undefined;
  let refreshFlight: Promise<string> | undefined;
  async function guestToken(): Promise<string> {
    await store.load();
    if (store.guest()) return store.guest()!;
    return (guestFlight ??= raw
      .post("/Auth/GuestToken")
      .then(async (r) => {
        if (!r.data?.isSuccess || !r.data.data?.token)
          throw new Error("دریافت توکن مهمان انجام نشد");
        await store.setGuest(r.data.data.token);
        return r.data.data.token as string;
      })
      .finally(() => {
        guestFlight = undefined;
      }));
  }
  async function refreshToken(): Promise<string> {
    if (refreshFlight) return refreshFlight;
    const credentials = store.get();
    const generation = store.generation();
    if (!credentials?.refreshToken) {
      if (credentials) await store.set(null);
      throw new Error("برای ادامه وارد حساب شوید");
    }
    return (refreshFlight = raw
      .post("/Auth/RefreshToken", JSON.stringify(credentials.refreshToken), {
        headers: { "Content-Type": "application/json" },
      })
      .then(async (r) => {
        if (!r.data?.isSuccess || !r.data?.data?.token)
          throw new Error("پاسخ تمدید توکن معتبر نیست");
        if (generation !== store.generation())
          throw new Error("حساب کاربری تغییر کرده است");
        await store.set(r.data.data as Tokens, "refresh");
        return r.data.data.token as string;
      })
      .catch(async (e) => {
        if ([400, 401, 403].includes(e.response?.status) && generation === store.generation())
          await store.set(null);
        throw e;
      })
      .finally(() => {
        refreshFlight = undefined;
      }));
  }
  const http = create({ baseURL, timeout: 20000 });
  http.interceptors.request.use(async (config) => {
    await store.load();
    Object.assign(config, { _actorGeneration: store.accountGeneration() });
    if (
      !/\/Auth\/(RefreshToken|GuestToken|SendResetPasswordCode|resetPassword)$/i.test(
        config.url || "",
      )
    )
      config.headers.Authorization = bearer(
        store.get()?.token || (await guestToken()),
      );
    return config;
  });
  http.interceptors.response.use(
    (r) => r,
    async (error) => {
      const c = error.config;
      if (
        !c ||
        error.response?.status !== 401 ||
        c._retry ||
        /\/Auth\//i.test(c.url || "")
      )
        throw error;
      if (c._actorGeneration !== store.accountGeneration())
        throw new Error("حساب کاربری تغییر کرده؛ درخواست دوباره ارسال نشد");
      c._retry = true;
      const active = store.get()?.token || store.guest();
      const sent = String(c.headers.Authorization || "");
      // An already-completed refresh may have changed the token while this 401 was in flight.
      if (active && bearer(active) !== sent) {
        c.headers.Authorization = bearer(active);
        return http(c);
      }
      if (store.get()) c.headers.Authorization = bearer(await refreshToken());
      else {
        await store.setGuest("");
        c.headers.Authorization = bearer(await guestToken());
      }
      return http(c);
    },
  );
  return { http, guestToken, refreshToken };
}
