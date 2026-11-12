"use client";
import { IoCopyOutline } from "react-icons/io5";
export const CopyButton = ({
  code,
  color = "#EC4899",
}: {
  code: string;
  color?: string;
}) => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
  };

  return (
    <button
      type="button"
      className="shrink-0 px-2 py-1 flex gap-x-1 text-white items-center justify-center rounded-md text-sm"
      style={{ backgroundColor: color }}
      onClick={handleCopy}
    >
      <span> کپی کردن</span> <IoCopyOutline />
    </button>
  );
};
