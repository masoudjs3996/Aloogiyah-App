export function normalizeMoney(value: string): string | null {
  const raw = value.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[,٬\s]/g, '').replace(/٫/g, '.');
  if (!/^\d*(?:\.\d{0,2})?$/.test(raw)) return null;
  const normalized = raw.replace(/^0+(?=\d)/, '');
  return normalized.startsWith('.') ? '0' + normalized : normalized;
}
export function formatMoneyInput(value: string | number): string {
  const [integer, fraction] = String(value).split('.');
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, '٬') + (fraction === undefined ? '' : '.' + fraction);
}
