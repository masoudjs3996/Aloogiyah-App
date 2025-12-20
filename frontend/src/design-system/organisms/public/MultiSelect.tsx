"use client";

import useOutsideClick from "@/shared/hooks/useClickOutside";
import { useState } from "react";

export type MultiSelectOption = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  label?: string;
  error?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
};

const MultiSelect = ({
  label,
  error,
  options,
  value,
  onChange,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useOutsideClick<HTMLDivElement>(() => {
    setOpen(false);
  });
  const toggleValue = (val: string) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
    );
  };

  const removeTag = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(true)}
        className="
          min-h-14 w-full flex flex-wrap items-center gap-1
          border border-secondary-200 rounded-lg px-2 py-1
          cursor-text focus-within:border-primary-500
        "
      >
        {value.length === 0 && (
          <span className="text-sm text-gray-400 px-1 select-none">
            انتخاب دسته‌بندی
          </span>
        )}
        {value.map((val) => {
          const option = options.find((o) => o.value === val);
          if (!option) return null;

          return (
            <div
              key={val}
              className="
                flex items-center justify-between gap-x-2 bg-white  border border-gray-200
                rounded-full px-2 py-2 text-sm
              "
            >
              <span className="text-gray-800 whitespace-nowrap">
                {option.label}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(val);
                }}
                className=" flex items-center justify-center w-5 h-5 rounded-full bg-red-700 text-white text-xs hover:bg-red-600 "
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* Fake input for spacing */}
        {/* <input
          className="flex-1 min-w-[80px] outline-none border-none text-sm"
          onFocus={() => setOpen(true)}
          readOnly
        /> */}
      </div>

      {label && (
        <label className="text-sm font-medium mt-1 block">{label}</label>
      )}
      {error && <span className="text-red-500 text-xs">{error}</span>}

      {/* ===== Dropdown ===== */}
      {open && (
        <div
          ref={containerRef}
          className="
            absolute z-50 mt-2 w-full max-h-72 overflow-y-auto
            bg-white border border-gray-200 rounded-lg p-1 shadow
          "
        >
          {options.map((opt) => {
            const selected = value.includes(opt.value);

            return (
              <div
                key={opt.value}
                onClick={() => toggleValue(opt.value)}
                className={`
                  flex items-center justify-between px-4 py-2 rounded-lg text-sm cursor-pointer
                  hover:bg-gray-100
                  
                `}
              >
                <span className="text-gray-800">{opt.label}</span>

                {selected && <span className=" text-blue-600">✔</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
