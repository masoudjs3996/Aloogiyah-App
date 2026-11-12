"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Copy, Download, Forward, Pencil, SquareCheck, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { platformApi, errorMessage } from "@/lib/actions/platform";
import type { Message, ChatConversation } from "@/shared/types/platform";
import { selectedMessagesText } from "@/shared/utils/message-selection";
import { downloadChatAttachment } from "@/shared/utils/download-chat-attachment";

export default function MessageActions({
  item,
  own,
  anchor,
  onSelect,
  onClose,
}: {
  item: Message;
  own: boolean;
  anchor: { x: number; y: number };
  onSelect: () => void;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [mode, setMode] = useState<"edit" | "forward" | "delete" | null>(null);
  const [text, setText] = useState(item.message);
  const [rooms, setRooms] = useState<ChatConversation[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(anchor);
  const editable = own && !item.isRead;
  useLayoutEffect(() => {
    if (mode || !menu.current) return;
    const bounds = menu.current.getBoundingClientRect();
    setPosition({
      x: Math.max(8, Math.min(anchor.x, window.innerWidth - bounds.width - 8)),
      y: Math.max(
        8,
        Math.min(anchor.y, window.innerHeight - bounds.height - 8),
      ),
    });
    menu.current
      .querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus({ preventScroll: true });
  }, [anchor, mode]);
  useEffect(() => {
    if (mode) return;
    const close = (event: Event) => {
      if (event.target instanceof Node && menu.current?.contains(event.target))
        return;
      onClose();
    };
    window.addEventListener("resize", close);
    // Close with a scrolling chat, instead of leaving a detached menu over another message.
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [mode, onClose]);
  async function run(action: () => Promise<unknown>, refresh = true) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await action();
      if (refresh) {
        await client.invalidateQueries({
          queryKey: ["platform", "conversation", item.conversationCode],
        });
        await client.invalidateQueries({ queryKey: ["platform", "chat-rooms"] });
      }
      onClose();
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const options = [
    ...(item.attachmentName ? [{
      label: "دانلود فایل",
      Icon: Download,
      action: () => void run(() => downloadChatAttachment(item), false),
    }] : []),
    {
      label: "کپی",
      Icon: Copy,
      action: () =>
        void run(() =>
          navigator.clipboard.writeText(selectedMessagesText([item])),
        ),
    },
    {
      label: "بازارسال",
      Icon: Forward,
      action: async () => {
        setBusy(true);
        setNotice("");
        try {
          setRooms(await platformApi.chatRooms());
          setMode("forward");
        } catch (error) {
          setNotice(errorMessage(error));
        } finally {
          setBusy(false);
        }
      },
    },
    {
      label: "انتخاب پیام",
      Icon: SquareCheck,
      action: () => {
        onSelect();
        onClose();
      },
    },
    ...(editable
      ? [
          { label: "ویرایش", Icon: Pencil, action: () => setMode("edit") },
          { label: "حذف", Icon: Trash2, action: () => setMode("delete") },
        ]
      : []),
  ];
  if (!mode)
    return createPortal(
      <div
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className="fixed inset-0 z-[110]" onPointerDown={onClose} />
        <div
          ref={menu}
          role="menu"
          aria-label="گزینه‌های پیام"
          dir="rtl"
          style={{ left: position.x, top: position.y }}
          className="fixed z-[111] max-h-[calc(100dvh-1rem)] w-52 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-2xl"
          onKeyDown={(event) => {
            const buttons = [
              ...(menu.current?.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
              ) ?? []),
            ];
            const current = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            if (event.key === "Escape" || event.key === "Tab") {
              onClose();
              return;
            }
            const index =
              event.key === "ArrowDown"
                ? (current + 1) % buttons.length
                : event.key === "ArrowUp"
                  ? (current - 1 + buttons.length) % buttons.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? buttons.length - 1
                      : -1;
            if (index >= 0) {
              event.preventDefault();
              buttons[index]?.focus();
            }
          }}
        >
          {options.map(({ label, Icon, action }) => (
            <button
              key={label}
              role="menuitem"
              type="button"
              disabled={busy}
              onClick={() => void action()}
              className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-right outline-none disabled:opacity-50 ${label === "حذف" ? "mt-1 border-t border-slate-100 text-rose-600 hover:bg-rose-50 focus:bg-rose-50" : "text-slate-700 hover:bg-emerald-50 focus:bg-emerald-50"}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
          {notice && (
            <p role="alert" className="p-2 text-xs text-rose-700">
              {notice}
            </p>
          )}
        </div>
      </div>,
      document.body,
    );
  return (
    <Dialog
      open
      onClose={() => {
        if (!busy) onClose();
      }}
      className="relative z-[120]"
      dir="rtl"
    >
      <div className="fixed inset-0 bg-slate-950/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="font-bold text-slate-800">
              {mode === "edit"
                ? "ویرایش پیام"
                : mode === "delete"
                  ? "حذف پیام"
                  : "بازارسال پیام"}
            </DialogTitle>
            <button
              disabled={busy}
              type="button"
              aria-label="بستن گزینه‌های پیام"
              onClick={onClose}
              className="p-2 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {mode === "edit" && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() => platformApi.editMessage(item.code, text.trim()));
              }}
            >
              <textarea
                autoFocus
                aria-label="ویرایش متن پیام"
                maxLength={4000}
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-slate-900"
              />
              <button
                disabled={busy || !text.trim()}
                type="submit"
                className="min-h-11 w-full rounded-xl bg-emerald-700 text-sm font-bold text-white disabled:opacity-50"
              >
                ذخیره ویرایش
              </button>
            </form>
          )}
          {mode === "delete" && (
            <div>
              <p className="mb-4 text-sm leading-7 text-slate-600">
                این پیام برای هر دو طرف حذف شود؟
              </p>
              <button
                disabled={busy}
                type="button"
                className="min-h-11 w-full rounded-xl bg-rose-600 text-sm font-bold text-white disabled:opacity-50"
                onClick={() =>
                  void run(() => platformApi.deleteMessage(item.code))
                }
              >
                تأیید حذف پیام
              </button>
            </div>
          )}
          {mode === "forward" && (
            <div className="space-y-2" aria-label="انتخاب مقصد بازارسال">
              {!rooms.length && (
                <p className="text-sm text-slate-500">
                  ابتدا یک گفتگو با مخاطب باز کنید.
                </p>
              )}
              {rooms.map((room) => (
                <button
                  key={room.code}
                  disabled={busy}
                  type="button"
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-slate-50 px-3 text-right text-sm text-slate-700 hover:bg-emerald-50"
                  onClick={() =>
                    void run(async () => {
                      const saved = await platformApi.forwardMessage(
                        item.code,
                        room.code,
                      );
                      await client.invalidateQueries({
                        queryKey: [
                          "platform",
                          "conversation",
                          saved.conversationCode,
                        ],
                      });
                    })
                  }
                >
                  <Forward className="h-4 w-4 text-emerald-700" />
                  {room.peerName}
                </button>
              ))}
            </div>
          )}
          {notice && (
            <p role="alert" className="mt-3 text-xs text-rose-700">
              {notice}
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 text-sm text-slate-600"
          >
            انصراف
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
