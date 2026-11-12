"use client";

import { useId } from "react";
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
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {label && <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>}
      <Textarea {...rest} id={id} aria-invalid={!!error} />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};