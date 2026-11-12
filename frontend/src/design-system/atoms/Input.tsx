"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { formControlClass } from "./formControlStyles";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  lable?: string;
  icon?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, lable, id, type = "text", ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    return (
      <div className="flex w-full min-w-0 flex-col gap-y-2">
        {lable && (
          <label htmlFor={controlId} className="block text-sm font-medium text-slate-700">
            {lable}{props.required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <div className="relative w-full min-w-0">
          {icon && (
            <span className="pointer-events-none absolute right-3 top-3 text-slate-500">
              {icon}
            </span>
          )}
          <input
            {...props}
            type={type}
            id={controlId}
            ref={ref}
            className={clsx(formControlClass, icon && "pr-10", className)}
          />
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
