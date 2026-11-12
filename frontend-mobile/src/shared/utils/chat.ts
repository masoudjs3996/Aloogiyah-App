import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Message, Page } from "../types/platform";

export function mergeChatMessage(client: QueryClient, message: Message) {
  if (!message?.code || !message.conversationCode) return;
  client.setQueryData<InfiniteData<Page<Message>>>(
    ["chat", "room", message.conversationCode],
    (old) => {
      const current = old ?? {
        pageParams: [1],
        pages: [{ items: [], totalCount: 0, pageNumber: 1, pageSize: 30 }],
      };
      if (message.isDeleted) return { ...current, pages: current.pages.map(page => ({ ...page, items: page.items.filter(item => item.code !== message.code) })) };
      if (
        current.pages.some((page) =>
          page.items.some((item) => item.code === message.code),
        )
      ) {
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.code === message.code ? { ...item, ...message } : item,
            ),
          })),
        };
      }
      const [first, ...rest] = current.pages;
      return {
        ...current,
        pages: [
          {
            ...first,
            items: [message, ...first.items],
            totalCount: first.totalCount + 1,
          },
          ...rest,
        ],
      };
    },
  );
}

export function chatTime(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  return new Date(value).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

