"use client";

import { FC, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  type?: string;
}

const Input: FC<InputProps> = ({ placeholder, type = "text", ...rest }) => {
  return (
    <input
      type={type}
      {...rest}
      placeholder={placeholder}
      className="w-full p-2 rounded-md flex-1 text-secondary-900  border-2 border-secondary-200 focus:border-primary-900"
    />
  );
};

export default Input;
