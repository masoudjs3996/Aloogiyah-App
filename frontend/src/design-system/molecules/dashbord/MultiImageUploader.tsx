"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { GoTrash } from "react-icons/go";

export type MultiImageUploadProps = {
  value?: File[];
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
};

type PreviewFile = {
  id: string;
  file: File;
  url: string;
};

export default function MultiImageUpload({
  value,
  onChange,
  maxFiles = 5,
  maxSize = 5,
  accept = "image/jpeg,image/png,image/webp",
  disabled = false,
  className = "",
}: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [error, setError] = useState("");

  const updateFiles = (next: PreviewFile[]) => {
    setFiles(next);
    onChange?.(next.map((item) => item.file));
  };

  const addFiles = (selectedFiles: File[]) => {
    if (disabled || !selectedFiles.length) return;

    setError("");

    const current = files.map((item) => item.file);
    const available = maxFiles - current.length;

    if (available <= 0) {
      setError(`حداکثر ${maxFiles} تصویر می‌توانید انتخاب کنید.`);
      return;
    }

    const selected = selectedFiles.slice(0, available);
    const validFiles: PreviewFile[] = [];

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setError("فقط فایل‌های تصویری مجاز هستند.");
        continue;
      }

      if (file.size > maxSize * 1024 * 1024) {
        setError(`حجم هر تصویر نباید بیشتر از ${maxSize}MB باشد.`);
        continue;
      }

      const duplicate = current.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      );

      if (duplicate) continue;

      validFiles.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      });
    }

    updateFiles([...files, ...validFiles]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;

    addFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (id: string) => {
    const target = files.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.url);

    updateFiles(files.filter((item) => item.id !== id));
    setError("");
  };

  return (
    <div
      className={`w-full  grid col-span-2 ${className} ${files.length > 0 ? "  grid-cols-1 lg:grid-cols-2 gap-10" : " grid-cols-1  gap-10"}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          "flex w-full min-h-44 cursor-pointer flex-col items-center justify-center",
          "rounded-xl border-2 border-dashed border-gray-300",
          "bg-gray-50 px-6 py-8 text-center transition",
          "hover:border-green-500 hover:bg-green-50",
          disabled ? "cursor-not-allowed opacity-50" : "",
        ].join(" ")}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
          📷
        </div>

        <p className="font-medium text-gray-700">
          تصاویر را اینجا بکشید و رها کنید
        </p>

        <p className="mt-1 text-sm text-gray-500">
          یا برای انتخاب تصاویر کلیک کنید
        </p>

        <p className="mt-2 text-xs text-gray-400">
          حداکثر {maxFiles} تصویر • حداکثر {maxSize}MB برای هر تصویر
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 ">
          {files.map((item, index) => {
            return (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl"
              >
                <div className="relative">
                  <img
                    src={item.url}
                    alt={item.file.name}
                    className="h-full w-full object-cover min-h-32 max-h-32  lg:max-h-20 min-w-32 "
                  />

                  {index === 0 && (
                    <div className="absolute bottom-0 z-10 w-full">
                      <div className="backdrop-blur-md bg-white/10 border-t border-white/20 px-3 py-1.5 flex items-center justify-center">
                        <span className="text-green-500 text-xs font-medium tracking-wide">
                          عکس اصلی
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeFile(item.id);
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white opacity-100 transition hover:bg-red-500"
                  aria-label={`حذف ${item.file.name}`}
                >
                  <GoTrash />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
