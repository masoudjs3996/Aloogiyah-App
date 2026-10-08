import type { Cart } from "@/shared/types/platform";

const STORAGE_PREFIX = "aloogiyah:checkout-attempt:";

/** Storage key scoped to the active cart in this browser tab. */
export function checkoutAttemptStorageKey(cartId: string): string {
  return `${STORAGE_PREFIX}${encodeURIComponent(cartId)}`;
}

/**
 * Stable snapshot of checkout-affecting values. If cart contents, address, or
 * discount change, the next attempt receives a new idempotency key.
 */
export function checkoutFingerprint(
  cart: Cart,
  addressCode: string,
  discountCode: string,
): string {
  const farms = cart.farms
    .map((farm) => ({
      farmCode: farm.farmCode,
      items: farm.items
        .map((item) => ({
          productCode: item.productCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
        .sort((a, b) => a.productCode.localeCompare(b.productCode)),
    }))
    .sort((a, b) => a.farmCode.localeCompare(b.farmCode));

  return JSON.stringify({
    cartId: cart.cartId,
    addressCode,
    discountCode: discountCode.trim().toUpperCase(),
    totalPrice: cart.totalPrice,
    farms,
  });
}

/** Remove the saved attempt once its checkout has reached a final state. */
export function clearCheckoutAttempt(checkoutCode: string): void {
  if (typeof window === "undefined" || !checkoutCode) return;

  try {
    const keys = Array.from({ length: window.sessionStorage.length }, (_, i) =>
      window.sessionStorage.key(i),
    ).filter((key): key is string => Boolean(key?.startsWith(STORAGE_PREFIX)));

    for (const key of keys) {
      try {
        const attempt = JSON.parse(window.sessionStorage.getItem(key) || "null");
        if (attempt?.checkoutCode === checkoutCode) {
          window.sessionStorage.removeItem(key);
        }
      } catch {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Session storage may be disabled; checkout itself must remain usable.
  }
}
