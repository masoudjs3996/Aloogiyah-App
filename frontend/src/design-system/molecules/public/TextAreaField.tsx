"use client";

import Textarea from "@/design-system/atoms/Textarea";

type TextAreaFieldProps = {
  label?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextAreaField = ({
  label,
  error,
  ...rest
}: TextAreaFieldProps) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Textarea {...rest} />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};