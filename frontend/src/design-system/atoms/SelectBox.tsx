"use client";

import { FC, ReactNode } from "react";

interface SelectBoxProps {
  label?: string;
  options: string[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  error?: string;
  icon?: ReactNode;
}

export const SelectBox: FC<SelectBoxProps> = ({
  label,
  options,
  value,
  placeholder = "انتخاب کنید",
  onChange,
  error,
  icon,
}) => {
  return (
    <div className="flex flex-col gap-y-2 w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div
        className={`flex items-center gap-x-2 rounded-md border-[2px] pr-2 ${
          error
            ? "border-error"
            : "border-secondary-700 focus-within:border-secondary-700"
        }`}
      >
     
        {icon && (
          <div className="flex items-center justify-center text-secondary-700">
            {icon}
          </div>
        )}

      
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full flex-1 rounded-l-md border-r-[2px] border-secondary-700 bg-white p-2 text-slate-700 outline-none"
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
      </div>

      {/* Error */}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
};

// "use client";

// import { FC } from "react";

// interface SelectBoxProps {
//   label?: string;
//   options: string[];
//   value?: string;
//   placeholder?: string;
//   onChange?: (value: string) => void;
//   error?: string;
// }

// export const SelectBox: FC<SelectBoxProps> = ({
//   label,
//   options,
//   value,
//   placeholder = "انتخاب کنید",
//   onChange,
//   error,
// }) => {
//   return (
//     <div className="flex flex-col w-full space-y-1">
//       {label && <label className="text-sm text-gray-700">{label}</label>}

//       <select
//         value={value}
//         onChange={(e) => onChange?.(e.target.value)}
//         className={`
//           w-full rounded-md border px-3 py-2 bg-secondary-0 text-secondary-600
//           focus:outline-none focus:ring-2 focus:ring-primary-500
//           ${error ? "border-error" : "border-secondary-50"}
//         `}
//       >
//         <option value="" disabled>
//           {placeholder}
//         </option>

//         {options.map((item, i) => (
//           <option key={i} value={item}>
//             {item}
//           </option>
//         ))}
//       </select>

//       {error && <span className="text-xs text-error">{error}</span>}
//     </div>
//   );
// };
