"use client";

import { FC } from "react";

interface SelectBoxProps {
  label?: string;
  options: string[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  error?: string;
}

export const SelectBox: FC<SelectBoxProps> = ({
  label,
  options,
  value,
  placeholder = "انتخاب کنید",
  onChange,
  error,
}) => {
  return (
    <div className="flex flex-col w-full space-y-1">
      {label && <label className="text-sm text-gray-700">{label}</label>}

      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          w-full rounded-md border px-3 py-2 bg-secondary-0 text-secondary-600 
          focus:outline-none focus:ring-2 focus:ring-primary-500
          ${error ? "border-error" : "border-secondary-50"}
        `}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((item, i) => (
          <option key={i} value={item}>
            {item}
          </option>
        ))}
      </select>

      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
};
