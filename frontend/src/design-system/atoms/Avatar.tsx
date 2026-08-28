"use client";
import Image from "next/image";
import UserAvatar from "../../../public/images/avatar/Avatar.png";
export const Avatar = ({ src, size = 90 }: { src?: string; size?: number }) => {
  return (
    <Image
      src={src || UserAvatar}
      alt="avatar"
      width={size}
      height={size}
      className={`rounded-full object-cover max-w-[90px] max-h-[90px] min-w-[90px] min-h-[90px]`}
    />
  );
};
