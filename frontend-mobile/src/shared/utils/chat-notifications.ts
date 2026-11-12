type ChatNoticeMessage = {
  code: string;
  conversationCode?: string;
  senderCode: string;
  receiverCode: string;
  isRead?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
};

export function shouldShowChatNotice(
  message: ChatNoticeMessage | undefined,
  me: string,
  activeRoom: string | undefined,
  foreground: boolean,
): boolean {
  if (
    !me ||
    !message?.code ||
    !message.senderCode ||
    message.senderCode === me ||
    message.receiverCode !== me ||
    message.isRead ||
    message.isDeleted ||
    message.isEdited
  )
    return false;
  const key = message.conversationCode || message.senderCode;
  return !(foreground && activeRoom === key);
}
