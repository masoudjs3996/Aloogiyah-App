export function chatFileSize(bytes: number): string {
  const size = Math.max(0, bytes);
  if (size >= 1024 * 1024)
    return `${(size / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`;
  if (size >= 1024)
    return `${(size / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوبایت`;
  return `${Math.round(size).toLocaleString("fa-IR")} بایت`;
}
