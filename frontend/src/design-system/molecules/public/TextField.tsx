"use client";

import Input from "@/design-system/atoms/Input";
import { ReactNode } from "react";

type TextFieldProps = {
  label?: string;
  error?: string;
  icon?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ label, icon, error, ...rest }: TextFieldProps) => {
  return (
    <div className="flex flex-col gap-1 ">
      <label className="text-sm font-medium">{label}</label>
      <Input {...rest} icon={icon} />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};
