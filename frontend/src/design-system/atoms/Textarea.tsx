"use client";

import React, { ReactNode } from "react";
import clsx from "clsx";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  lable?: string;
  icon?: ReactNode;
};

const Textarea = ({ className, icon, lable, ...props }: TextareaProps) => {
  return (
    <div className="flex flex-col gap-y-2">
      <label htmlFor="" className=" block  text-sm font-medium text-slate-700">
        {lable}
      </label>
      <div className="flex items-center justify-center gap-x-2   border-[2px] border-secondary-700 focus:border-secondary-700 rounded-md pr-2 ">
        {icon && (
          <div className="flex items-center justify-center text-secondary-700">
            {icon}
          </div>
        )}
        <textarea
          {...props}
          className={clsx(
            "w-full rounded-l-md bg-white px-3 py-2 text-sm outline-none border-r-[2px] border-secondary-700 transition",
            className,
          )}
        />
      </div>
    </div>
  );
};

export default Textarea;
