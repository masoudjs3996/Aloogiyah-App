"use client";

import { forwardRef, useId, type TextareaHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { formControlClass } from "./formControlStyles";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  lable?: string;
  icon?: ReactNode;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, icon, lable, id, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    return (
      <div className="flex w-full min-w-0 flex-col gap-y-2">
        {lable && (
          <label htmlFor={controlId} className="block text-sm font-medium text-slate-700">
            {lable}
          </label>
        )}
        <div className="relative w-full min-w-0">
          {icon && (
            <span className="pointer-events-none absolute right-3 top-3 text-slate-500">
              {icon}
            </span>
          )}
          <textarea
            {...props}

            id={controlId}
            ref={ref}
            className={clsx(formControlClass, icon && "pr-10", className)}
          />
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
export default Textarea;
