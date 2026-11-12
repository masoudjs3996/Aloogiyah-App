import * as SecureStore from "./credentialStorage";
import type { Tokens } from "../shared/types/mobile";
// A single credential record keeps the rotating access/refresh pair consistent.
let state: Tokens | null = null;
let guest: string | null = null;
let epoch = 0;
let actor = 0;
let loaded: Promise<void> | undefined;
const listeners = new Set<() => void>();
export const session = {
  load: () =>
    (loaded ??= Promise.all([
      SecureStore.getItemAsync("aloogiyah.session"),
      SecureStore.getItemAsync("aloogiyah.guest"),
    ])
      .then(([value, guestValue]) => {
        guest = guestValue;
        if (value) {
          try {
            const parsed = JSON.parse(value);
            state = typeof parsed?.token === "string" ? parsed : null;
          } catch {
            state = null;
          }
        }
      })
      .catch((error) => {
        loaded = undefined;
        throw error;
      })),
  get: () => state,
  generation: () => epoch,
  accountGeneration: () => actor,
  guest: () => guest,
  setGuest: async (token: string) => {
    guest = token;
    if (token) await SecureStore.setItemAsync("aloogiyah.guest", token);
    else await SecureStore.deleteItemAsync("aloogiyah.guest");
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  set: async (tokens: Tokens | null, mode?: "refresh") => {
    if (mode !== "refresh") actor++;
    epoch++;
    state = tokens;
    if (tokens)
      await SecureStore.setItemAsync(
        "aloogiyah.session",
        JSON.stringify(tokens),
      );
    else await SecureStore.deleteItemAsync("aloogiyah.session");
    listeners.forEach((fn) => fn());
  },
};
export const bearer = (token: string) =>
  `Bearer ${token.replace(/^\s*Bearer\s+/i, "").trim()}`;
