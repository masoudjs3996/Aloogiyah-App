// Store only the 24 domestic digits; the IR prefix is fixed in the form.
export function iranIbanDigits(value: string): string | null {
  const raw = value.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s-]/g, '').replace(/^IR/i, '');
  return /^\d{0,24}$/.test(raw) ? raw : null;
}

export const settlementRules = [
  'درخواست‌های ثبت‌شده قبل از ساعت ۱۲ ظهر پنج‌شنبه، به وقت تهران، شنبهٔ پیشِ رو تسویه می‌شوند.',
  'درخواست‌های ساعت ۱۲ ظهر پنج‌شنبه به بعد، در نوبت شنبهٔ هفتهٔ بعد قرار می‌گیرند.',
  'اگر روز تسویه تعطیل باشد، واریز به اولین روز کاری بعد منتقل می‌شود.',
];
