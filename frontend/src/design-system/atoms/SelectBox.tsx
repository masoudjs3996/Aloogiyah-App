"use client";

import { FC, ReactNode, useState, useRef, useEffect } from "react";


interface SelectBoxProps {
  label?: string;
  options: string[];
  value?: string | string[];
  placeholder?: string;
  onChange?: (value: string | string[]) => void;
  error?: string;
  icon?: ReactNode;
  multiple?: boolean;
}

export const SelectBox: FC<SelectBoxProps> = ({
  label,
  options,
  value,
  placeholder = "انتخاب کنید",
  onChange,
  error,
  icon,
  multiple = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple ? (Array.isArray(value) ? value : []) : [],
  );
  const [selectedValue, setSelectedValue] = useState<string>(
    !multiple && typeof value === "string" ? value : "",
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (multiple) {
      setSelectedValues(Array.isArray(value) ? value : []);
    } else {
      setSelectedValue(typeof value === "string" ? value : "");
    }
  }, [value, multiple]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    if (multiple) {
      let newValues: string[];
      if (selectedValues.includes(option)) {
        newValues = selectedValues.filter((item) => item !== option);
      } else {
        newValues = [...selectedValues, option];
      }
      setSelectedValues(newValues);
      onChange?.(newValues);
    } else {
      setSelectedValue(option);
      onChange?.(option);
      setIsOpen(false);
    }
  };

  const removeValue = (option: string) => {
    if (multiple) {
      const newValues = selectedValues.filter((item) => item !== option);
      setSelectedValues(newValues);
      onChange?.(newValues);
    }
  };

  const getDisplayText = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      return `${selectedValues.length} مورد انتخاب شده`;
    }
    return selectedValue || placeholder;
  };

  return (
    <div className="flex flex-col gap-y-2 w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center gap-x-2 rounded-md border-[2px] pr-2  ${
          error
            ? "border-error"
            : "border-secondary-700 focus-within:border-secondary-700"
        }`}
      >
        {icon && (
          <div className="flex items-center justify-center text-secondary-700 pl-2">
            {icon}
          </div>
        )}

        {/* نمایش انتخاب‌ها */}
        <div
          className="flex-1 flex items-center gap-1 flex-wrap p-2 cursor-pointer min-h-[42px]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {multiple ? (
            selectedValues.length > 0 ? (
              selectedValues.map((item) => (
                <span
                  key={item}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                >
                  {item}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(item);
                    }}
                    className="hover:text-blue-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )
          ) : (
            <span
              className={selectedValue ? "text-slate-700" : "text-slate-400"}
            >
              {getDisplayText()}
            </span>
          )}
        </div>

        {/* آیکون فلش */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-10 bg-white left-0 z-50 w-full mt-1 border border-secondary-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {multiple && (
              <div className="p-2 border-b border-secondary-200">
                <button
                  onClick={() => {
                    setSelectedValues([]);
                    onChange?.([]);
                    setIsOpen(false);
                  }}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  پاک کردن همه
                </button>
              </div>
            )}
            {options.map((option, index) => {
              const isSelected = multiple
                ? selectedValues.includes(option)
                : selectedValue === option;
              return (
                <div
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2 ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  )}
                  <span
                    className={isSelected ? "text-blue-600 font-medium" : ""}
                  >
                    {option}
                  </span>
                  {isSelected && !multiple && (
                    <svg
                      className="w-4 h-4 text-blue-600 mr-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
};

// "use client";

// import { FC, ReactNode } from "react";

// interface SelectBoxProps {
//   label?: string;
//   options: string[];
//   value?: string;
//   placeholder?: string;
//   onChange?: (value: string) => void;
//   error?: string;
//   icon?: ReactNode;
// }

// export const SelectBox: FC<SelectBoxProps> = ({
//   label,
//   options,
//   value,
//   placeholder = "انتخاب کنید",
//   onChange,
//   error,
//   icon,
// }) => {
//   return (
//     <div className="flex flex-col gap-y-2 w-full">
//       {label && (
//         <label className="block text-sm font-medium text-slate-700">
//           {label}
//         </label>
//       )}

//       <div
//         className={`flex items-center gap-x-2 rounded-md border-[2px] pr-2 ${
//           error
//             ? "border-error"
//             : "border-secondary-700 focus-within:border-secondary-700"
//         }`}
//       >

//         {icon && (
//           <div className="flex items-center justify-center text-secondary-700">
//             {icon}
//           </div>
//         )}

//         <select
//           value={value}
//           onChange={(e) => onChange?.(e.target.value)}
//           className="w-full flex-1 rounded-l-md border-r-[2px] border-secondary-700 bg-white p-2 text-slate-700 outline-none"
//         >
//           <option value="" disabled>
//             {placeholder}
//           </option>

//           {options.map((item, i) => (
//             <option key={i} value={item}>
//               {item}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Error */}
//       {error && <span className="text-xs text-error">{error}</span>}
//     </div>
//   );
// };
