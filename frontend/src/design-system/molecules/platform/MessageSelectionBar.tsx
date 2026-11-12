"use client";
import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Copy, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { Message, Page } from "@/shared/types/platform";
import { platformApi, errorMessage } from "@/lib/actions/platform";
import {
  canDeleteMessages,
  selectedMessagesText,
} from "@/shared/utils/message-selection";

export default function MessageSelectionBar({
  messages,
  me,
  onClose,
}: {
  messages: Message[];
  me: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const allowed = canDeleteMessages(messages, me);
  return (
    <div
      className="shrink-0 border-y border-emerald-100 bg-emerald-50 px-3 py-2 sm:px-5"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="ml-auto text-xs font-bold text-emerald-900">
          {messages.length.toLocaleString("fa-IR")} پیام انتخاب‌شده
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                selectedMessagesText(messages),
              );
              setNotice("پیام‌های انتخاب‌شده کپی شدند");
            } catch (error) {
              setNotice(errorMessage(error));
            }
          }}
          className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
        >
          <Copy className="h-4 w-4" />
          کپی
        </button>
        <button
          type="button"
          disabled={busy || !allowed}
          onClick={() => {
            setNotice("");
            setConfirm(true);
          }}
          className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          حذف
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="لغو انتخاب پیام‌ها"
          className="rounded-xl p-3 text-slate-600 hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!allowed && (
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          حذف فقط برای پیام‌های ارسال‌شده توسط شما که هنوز خوانده نشده‌اند فعال
          است.
        </p>
      )}
      {notice && (
        <p role="status" className="mt-1 text-xs text-emerald-800">
          {notice}
        </p>
      )}
      <Dialog
        open={confirm}
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
        className="relative z-[120]"
        dir="rtl"
      >
        <div className="fixed inset-0 bg-slate-950/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <DialogTitle className="flex items-center gap-2 font-bold text-rose-700">
              <Trash2 className="h-5 w-5" />
              حذف پیام‌های انتخاب‌شده
            </DialogTitle>
            <p className="my-4 text-sm leading-7 text-slate-600">
              {messages.length.toLocaleString("fa-IR")} پیام برای هر دو طرف حذف
              شود؟
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy || !allowed}
                className="min-h-11 flex-1 rounded-xl bg-rose-600 text-sm font-bold text-white disabled:opacity-50"
                onClick={async () => {
                  setBusy(true);
                  setNotice("");
                  try {
                    const codes = await platformApi.deleteMessages(
                      messages.map((message) => message.code),
                    );
                    const removed = new Set(codes);
                    client.setQueryData<InfiniteData<Page<Message>>>(
                      [
                        "platform",
                        "conversation",
                        messages[0].conversationCode,
                      ],
                      (old) =>
                        old
                          ? {
                              ...old,
                              pages: old.pages.map((page) => ({
                                ...page,
                                items: page.items.filter(
                                  (item) => !removed.has(item.code),
                                ),
                              })),
                            }
                          : old,
                    );
                    setConfirm(false);
                    onClose();
                  } catch (error) {
                    setNotice(errorMessage(error));
                    setConfirm(false);
                  } finally {
                    setBusy(false);
                    void client.invalidateQueries({
                      queryKey: ["platform", "conversation"],
                    });
                    void client.invalidateQueries({
                      queryKey: ["platform", "chat-rooms"],
                    });
                  }
                }}
              >
                {busy ? "در حال حذف…" : "تأیید حذف"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirm(false)}
                className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm"
              >
                انصراف
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
