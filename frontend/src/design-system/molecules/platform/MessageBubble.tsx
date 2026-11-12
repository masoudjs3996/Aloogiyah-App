"use client";
import { useEffect, useRef, useState } from "react";
import ChatFileDownload from "./ChatFileDownload";
import MessageActions from "./MessageActions";
import type { Message } from "@/shared/types/platform";
import { CheckIcon, ClockIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { dateLabel } from "@/shared/utils/platform";
export default function MessageBubble({
  item,
  own,
  onRetry,
  selectionMode = false,
  selected = false,
  onSelect,
  grouped = false,
}: {
  item: Message & { localState?: "pending" | "failed" };
  own: boolean;
  grouped?: boolean;
  onRetry?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const photo =
    !!item.attachmentName && item.attachmentType?.startsWith("image/");
  const media = photo || (!!item.attachmentName && item.attachmentType?.startsWith("video/"));
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const press = useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);
  const held = useRef(false);
  const cancelHold = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  useEffect(
    () => () => {
      if (press.current) clearTimeout(press.current.timer);
    },
    [],
  );
  useEffect(() => {
    if (selectionMode) setAnchor(null);
  }, [selectionMode]);
  const interactive = (target: EventTarget) =>
    target instanceof Element &&
    !!target.closest(
      "button,a,input,textarea,video,audio,[data-message-interactive]",
    );
  const closeActions = () => {
    setAnchor(null);
    bubble.current?.focus({ preventScroll: true });
  };
  return (
    <div
      className={`flex items-center gap-2 ${own ? "justify-start" : "justify-end"}`}
    >
      {selectionMode && !item.localState && (
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label="انتخاب پیام"
          onClick={onSelect}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300 bg-white"}`}
        >
          {selected && <CheckIcon className="h-4 w-4" />}
        </button>
      )}
      <div
        ref={bubble}
        onPointerDown={(event) => {
          if (!event.currentTarget.contains(event.target as Node)) return;
          if (
            item.localState ||
            event.button !== 0 ||
            interactive(event.target)
          )
            return;
          held.current = false;
          cancelHold();
          press.current = {
            x: event.clientX,
            y: event.clientY,
            timer: setTimeout(() => {
              held.current = true;
              setAnchor(null);
              onSelect?.();
            }, 500),
          };
        }}
        onPointerMove={(event) => {
          if (
            press.current &&
            Math.hypot(
              event.clientX - press.current.x,
              event.clientY - press.current.y,
            ) > 8
          )
            cancelHold();
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
        onClick={(event) => {
          if (!event.currentTarget.contains(event.target as Node)) return;
          if (item.localState || interactive(event.target)) return;
          if (held.current) {
            held.current = false;
            return;
          }
          if (selectionMode) {
            onSelect?.();
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          setAnchor({
            x: event.clientX || rect.left,
            y: event.clientY || rect.bottom,
          });
        }}
        onContextMenu={(event) => {
          if (!event.currentTarget.contains(event.target as Node)) return;
          if (!item.localState) {
            event.preventDefault();
            cancelHold();
            setAnchor({ x: event.clientX, y: event.clientY });
          }
        }}
        tabIndex={item.localState ? undefined : 0}
        aria-label={
          selected
            ? "پیام انتخاب‌شده"
            : "پیام؛ کلیک برای گزینه‌ها، نگه‌داشتن برای انتخاب"
        }
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (
            event.key === "ContextMenu" ||
            (event.shiftKey && event.key === "F10") ||
            event.key === "Enter"
          ) {
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            if (!item.localState) setAnchor({ x: rect.left, y: rect.bottom });
          }
          if (event.key === " " && !item.localState) {
            event.preventDefault();
            onSelect?.();
          }
        }}
        className={`${grouped ? "w-full min-w-0" : "max-w-[85%] sm:max-w-[70%]"} rounded-2xl select-none ${selected ? "ring-2 ring-emerald-600 ring-offset-2" : ""} ${photo ? "p-1 pb-2" : "px-4 py-3"} ${own ? "rounded-tr-sm bg-emerald-100 text-emerald-950" : "rounded-tl-sm border border-slate-100 bg-white text-slate-800"}`}
      >
        {item.attachmentName && (
          <div className="relative">
            <ChatFileDownload item={item} />
            {media && !item.localState && !selectionMode && (
              <button type="button" aria-label="گزینه‌های پیام پیوست" aria-haspopup="menu"
                onClick={event => {
                  event.stopPropagation();
                  const rect = event.currentTarget.getBoundingClientRect();
                  setAnchor({ x: rect.left, y: rect.bottom });
                }}
                className="absolute right-1 top-1 z-10 grid min-h-11 min-w-11 place-items-center rounded-full bg-slate-950/75 text-white hover:bg-slate-950 focus-visible:outline-white">
                <EllipsisHorizontalIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        {!grouped && !(item.attachmentName && item.message === "فایل پیوست") && (
          <p
            dir="auto"
            className={`whitespace-pre-wrap break-words text-sm leading-7 ${photo ? "px-2" : ""}`}
          >
            {item.message}
          </p>
        )}
        {item.isEdited && (
          <span className="text-[10px] text-slate-500">ویرایش‌شده</span>
        )}
        {!item.localState && anchor && (
          <MessageActions
            item={item}
            own={own}
            anchor={anchor}
            onSelect={() => onSelect?.()}
            onClose={closeActions}
          />
        )}
        <div
          className={`mt-2 flex gap-3 text-[10px] ${photo ? "px-2" : ""} ${own ? "text-emerald-700" : "text-slate-400"}`}
        >
          <span>{dateLabel(item.createdAt)}</span>
          {own && item.localState === "pending" && (
            <ClockIcon
              className="h-3.5 w-3.5"
              aria-label="در انتظار ارسال"
              title="در انتظار ارسال"
            />
          )}
          {own && item.localState === "failed" && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 text-amber-800"
              title="تلاش دوباره برای ارسال"
            >
              <ClockIcon className="h-3.5 w-3.5" />
              <span>تلاش دوباره</span>
            </button>
          )}
          {own &&
            !item.localState &&
            (item.isRead ? (
              <span
                className="relative inline-flex h-4 w-[17px] text-sky-700"
                aria-label="خوانده شده"
                title="خوانده شده"
              >
                <CheckIcon className="absolute right-0 h-3.5 w-3.5" />
                <CheckIcon className="absolute right-[3px] h-3.5 w-3.5" />
              </span>
            ) : (
              <CheckIcon
                className="h-3.5 w-3.5"
                aria-label="ارسال شده"
                title="ارسال شده"
              />
            ))}
        </div>
      </div>
    </div>
  );
}
