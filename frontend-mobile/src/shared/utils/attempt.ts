import * as SecureStore from "../../api/credentialStorage";
import * as Crypto from "expo-crypto";
// Persist the fingerprint's hash, not the cart/request content. Retries survive app restarts.
export async function attemptKey(
  topic: "checkout" | "quality",
  fingerprint: string,
) {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    fingerprint,
  );
  const name = `aloogiyah.attempt.${topic}`;
  const raw = await SecureStore.getItemAsync(name);
  if (raw) {
    try {
      const value = JSON.parse(raw);
      if (value.hash === hash && typeof value.key === "string")
        return value.key as string;
    } catch {}
  }
  const key = Crypto.randomUUID();
  await SecureStore.setItemAsync(name, JSON.stringify({ hash, key }));
  return key;
}
export const completeAttempt = (topic: "checkout" | "quality") =>
  SecureStore.deleteItemAsync(`aloogiyah.attempt.${topic}`);
