"use client";

import Input from "@/design-system/atoms/Input";
import { forwardRef, type ReactNode, useId } from "react";

type TextFieldProps = {
  label?: string;
  error?: string;
  icon?: ReactNode;
  trailingAction?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(({ label, icon, error, trailingAction, ...rest }, ref) => {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 ">
      {label && <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <Input {...rest} ref={ref} id={id} aria-invalid={!!error} icon={icon} />
        {trailingAction && <div className="absolute inset-y-0 left-1 flex items-center">{trailingAction}</div>}
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
});

TextField.displayName = "TextField";
