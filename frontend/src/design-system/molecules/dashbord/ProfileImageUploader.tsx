"use client";

import { Avatar } from "@/design-system/atoms/Avatar";
import { GrEdit } from "react-icons/gr";
import type { ChangeEvent } from "react";

export const ProfileImageUploader = ({
  image,
  onChange,
  busy = false,
}: {
  image?: string | null;
  onChange: (file: File) => void;
  busy?: boolean;
}) => {
  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && !busy) onChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-2" aria-busy={busy}>
      <div className="relative">
        <Avatar src={image || undefined} />

        <label className="absolute bottom-2 right-2 w-7 h-7 bg-success rounded-full flex items-center justify-center cursor-pointer">
          <GrEdit className="text-white w-4 h-4" />
          <input
            type="file"
            accept="image/*"
            aria-label="انتخاب عکس پروفایل"
            disabled={busy}
            hidden
            onChange={handleSelect}
          />
        </label>
      </div>

      <label className="cursor-pointer text-sm text-gray-600">
        <span role="status">
          {busy ? "در حال ذخیره عکس…" : "ویرایش عکس پروفایل"}
        </span>
        <input
          type="file"
          accept="image/*"
          aria-label="ویرایش عکس پروفایل"
          disabled={busy}
          hidden
          onChange={handleSelect}
        />
      </label>
    </div>
  );
};
