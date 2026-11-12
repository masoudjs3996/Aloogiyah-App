"use client";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  PaperClipIcon,
  PhotoIcon,
  CameraIcon,
  FilmIcon,
} from "@heroicons/react/24/outline";
import { errorMessage } from "@/lib/actions/platform";
import { prepareChatPhoto } from "@/shared/utils/chat-photo";
export default function ChatFileUpload({
  roomCode,
  receiverCode,
  onQueue,
}: {
  roomCode: string;
  receiverCode: string;
  onQueue: (files: File[], room: string, receiver: string, caption: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const currentReceiver = useRef(receiverCode);
  currentReceiver.current = receiverCode;
  const chooser = useRef<HTMLDialogElement>(null);
  const review = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<{ room: string; receiver: string; files: File[]; caption: string } | null>(null);
  const inputs = useRef<
    Partial<
      Record<"file" | "photo" | "camera" | "video", HTMLInputElement | null>
    >
  >({});
  useEffect(() => {
    chooser.current?.close();
    setDraft(null);
  }, [receiverCode]);
  useEffect(() => {
    if (draft && !review.current?.open) review.current?.showModal();
  }, [draft]);

  async function select(
    files: File[],
    kind: "file" | "photo" | "camera" | "video",
  ) {
    if (!files.length || !roomCode || !receiverCode || locked.current) return;
    if (files.length > 5) {
      toast.error("حداکثر ۵ فایل را با هم انتخاب کنید.");
      return;
    }
    const room = roomCode;
    locked.current = true;
    setBusy(true);
    try {
      const preparedFiles: File[] = [];
      for (const file of files) {
        if (currentReceiver.current !== receiverCode) break;
        try {
          const prepared = kind === "photo" || kind === "camera" ? await prepareChatPhoto(file) : file;
          if (
            !/\.(jpe?g|png|webp|pdf|docx|xlsx|mp4|mov|webm)$/i.test(prepared.name) ||
            prepared.size <= 0 ||
            prepared.size > (/\.(mp4|mov|webm)$/i.test(prepared.name) ? 50 : 10) * 1024 * 1024
          ) throw new Error("ویدئو MP4، MOV یا WEBM تا ۵۰ مگابایت و تصویر یا فایل تا ۱۰ مگابایت مجاز است.");
          if (currentReceiver.current === receiverCode) preparedFiles.push(prepared);
        } catch (err) {
          toast.error(errorMessage(err));
        }
      }
      if (preparedFiles.length && currentReceiver.current === receiverCode)
        setDraft({ room, receiver: receiverCode, files: preparedFiles, caption: "" });
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        aria-label="افزودن پیوست"
        aria-haspopup="dialog"
        disabled={!roomCode || busy || !!draft}
        onClick={() => chooser.current?.showModal()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-emerald-700 hover:bg-emerald-50 focus-visible:outline-emerald-600 disabled:opacity-50"
      >
        <PaperClipIcon className="h-5 w-5" />
      </button>
      <dialog
        ref={chooser}
        aria-label="انتخاب نوع پیوست"
        className="fixed inset-x-0 bottom-4 top-auto m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-4 text-slate-800 shadow-xl backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === e.currentTarget) chooser.current?.close();
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold">افزودن پیوست</span>
          <button
            type="button"
            onClick={() => chooser.current?.close()}
            className="rounded-lg px-3 py-2 text-sm"
          >
            بستن
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["photo", "camera", "video", "file"] as const).map((kind) => {
            const label =
              kind === "photo"
                ? "عکس"
                : kind === "camera"
                  ? "دوربین"
                  : kind === "video"
                    ? "ویدئو"
                    : "فایل";
            const Icon =
              kind === "photo"
                ? PhotoIcon
                : kind === "camera"
                  ? CameraIcon
                  : kind === "video"
                    ? FilmIcon
                    : PaperClipIcon;
            return (
              <button
                key={kind}
                type="button"
                disabled={busy || !roomCode}
                onClick={() => {
                  chooser.current?.close();
                  inputs.current[kind]?.click();
                }}
                className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800 hover:bg-emerald-100 focus-visible:outline-emerald-600"
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
      </dialog>
      {(["photo", "camera", "video", "file"] as const).map((kind) => (
        <input
          key={kind}
          ref={(el) => {
            inputs.current[kind] = el;
          }}
          type="file"
          multiple={kind !== "camera"}
          hidden
          aria-label={
            kind === "file"
              ? "ارسال فایل"
              : kind === "photo"
                ? "انتخاب عکس"
                : kind === "video"
                  ? "انتخاب فیلم"
                  : "گرفتن عکس با دوربین"
          }
          accept={
            kind === "file"
              ? ".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.mp4,.mov,.webm"
              : kind === "video"
                ? ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                : "image/*"
          }
          capture={kind === "camera" ? "environment" : undefined}
          disabled={!roomCode || busy}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void select(files, kind);
          }}
        />
      ))}
      {draft && (
        <dialog ref={review} dir="rtl" aria-label="تأیید ارسال پیوست"
          onCancel={event => { event.preventDefault(); setDraft(null); }}
          className="m-auto max-h-[85dvh] w-[min(420px,92vw)] overflow-y-auto rounded-2xl bg-white p-4 text-slate-800 shadow-xl backdrop:bg-black/45">
          <h2 className="mb-3 text-base font-bold">تأیید ارسال پیوست</h2>
          <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))] gap-2">
            {draft.files.map((file, index) => (
              <div key={index} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-2">
                <AttachmentPreview file={file} />
              </div>
            ))}
          </div>
          <label className="mt-2 block text-xs font-bold">
            کپشن اختیاری
            <textarea value={draft.caption} rows={2} maxLength={4000}
              placeholder="برای فایل‌ها یک کپشن بنویسید…"
              onChange={event => {
                const caption = event.target.value;
                setDraft(current => current && { ...current, caption });
              }}
              className="mt-1 block w-full resize-y rounded-lg border border-slate-200 bg-white p-2 text-sm font-normal" />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={() => setDraft(null)}>انصراف</button>
            <button type="button" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
              onClick={() => {
                if (!review.current?.open) return;
                review.current.close();
                if (draft.receiver === currentReceiver.current)
                  onQueue(draft.files, draft.room, draft.receiver, draft.caption.trim());
                setDraft(null);
              }}>ارسال</button>
          </div>
        </dialog>
      )}
    </>
  );
}

function AttachmentPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  const video = /\.(mp4|mov|webm)$/i.test(file.name);
  const image = /\.(jpe?g|png|webp)$/i.test(file.name);
  useEffect(() => {
    if (!video && !image) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, image, video]);
  return (
    <>
      {url && video && <video src={url} controls playsInline preload="metadata" className="mx-auto mb-2 max-h-48 max-w-full rounded-lg" />}
      {url && image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="" className="mx-auto mb-2 max-h-48 max-w-full rounded-lg object-contain" />
      )}
      <p className="break-all text-sm" dir="auto">{file.name}</p>
    </>
  );
}
