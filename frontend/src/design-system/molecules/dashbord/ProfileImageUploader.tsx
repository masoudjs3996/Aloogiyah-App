"use client";

import { Avatar } from "@/design-system/atoms/Avatar";
import { GrEdit } from "react-icons/gr";

export const ProfileImageUploader = ({ image, onChange }: any) => {
  const handleSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar src={image} />

        <label className="absolute bottom-2 right-2 w-7 h-7 bg-success rounded-full flex items-center justify-center cursor-pointer">
          <GrEdit className="text-white w-4 h-4" />
          <input type="file" hidden onChange={handleSelect} />
        </label>
      </div>

      <label className="cursor-pointer text-sm text-gray-600">
        ویرایش عکس پروفایل
        <input type="file" hidden onChange={handleSelect} />
      </label>
    </div>
  );
};
