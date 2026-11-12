type SelectableMessage = {
  code: string;
  senderCode: string;
  isRead?: boolean;
  isDeleted?: boolean;
  localState?: string;
  message: string;
  attachmentName?: string | null;
  createdAt: string;
};
export const maxSelectedMessages = 100;
export function toggleMessageSelection(
  codes: string[],
  code: string,
): string[] {
  if (codes.includes(code)) return codes.filter((item) => item !== code);
  return codes.length < maxSelectedMessages ? [...codes, code] : codes;
}
export function canDeleteMessages(
  messages: SelectableMessage[],
  me: string,
): boolean {
  return (
    !!me &&
    messages.length > 0 &&
    messages.length <= maxSelectedMessages &&
    messages.every(
      (item) =>
        item.senderCode === me &&
        !item.isRead &&
        !item.isDeleted &&
        !item.localState,
    )
  );
}
export function selectedMessagesText(messages: SelectableMessage[]): string {
  return [...messages]
    .sort(
      (a, b) =>
        Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
        a.code.localeCompare(b.code),
    )
    .map((item) =>
      item.attachmentName
        ? [
            item.message === "فایل پیوست" ? "" : item.message,
            item.attachmentName,
          ]
            .filter(Boolean)
            .join("\n")
        : item.message,
    )
    .join("\n\n");
}
