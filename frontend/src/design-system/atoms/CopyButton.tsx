"use client";
import { IoCopyOutline } from "react-icons/io5";
export const CopyButton = ({ code }: { code: string }) => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
  };

  return (
    <button
      className="px-2 py-1 flex gap-x-1 text-secondary-0 items-center justify-center  bg-pink-500  rounded-md text-sm"
      onClick={handleCopy}
    >
      <span> کپی کردن</span> <IoCopyOutline />
    </button>
  );
};
