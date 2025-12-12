"use client";

import Input from "@/design-system/atoms/Input";

type TextFieldProps = {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ label, error, ...rest }: TextFieldProps) => {
  return (
    <div className="flex flex-col gap-1 ">
      <label className="text-sm font-medium">{label}</label>
      <Input {...rest} />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};
