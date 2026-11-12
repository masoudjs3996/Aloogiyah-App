type AttachmentItem = {
  code: string;
  senderCode?: string;
  attachmentGroupId?: string;
  attachmentGroupPosition?: number;
  caption?: string;
  message?: string;
  editedAt?: string;
};

export function chatAttachmentRows<T extends AttachmentItem>(items: readonly T[], ownCode: string) {
  const rows: { code: string; items: T[]; grouped: boolean; caption: string }[] = [];
  const groups = new Map<string, (typeof rows)[number]>();
  for (const item of items) {
    if (!item.attachmentGroupId) {
      rows.push({ code: item.code, items: [item], grouped: false, caption: "" });
      continue;
    }
    const key = `group:${item.senderCode ?? ownCode}:${item.attachmentGroupId}`;
    const existing = groups.get(key);
    if (existing) existing.items.push(item);
    else {
      const row = { code: key, items: [item], grouped: true, caption: "" };
      groups.set(key, row);
      rows.push(row);
    }
  }
  for (const row of groups.values()) {
    const sentPositions = new Set(row.items.filter(item => item.message !== undefined).map(item => item.attachmentGroupPosition));
    row.items = row.items.filter(item => item.message !== undefined || !sentPositions.has(item.attachmentGroupPosition));
    row.items.sort((a, b) => (a.attachmentGroupPosition ?? 0) - (b.attachmentGroupPosition ?? 0));
    const edited = row.items.reduce<T | undefined>((latest, item) =>
      item.editedAt && (!latest?.editedAt || item.editedAt > latest.editedAt) ? item : latest, undefined);
    const caption = (edited ?? row.items[0]).message ?? row.items[0].caption;
    row.caption = caption && caption !== "فایل پیوست" ? caption : "";
  }
  return rows;
}
