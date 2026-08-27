"use client";

import { FC, InputHTMLAttributes, ReactNode } from "react";


interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  type?: string;
  lable?: string;
  icon?: ReactNode;
}

const Input: FC<InputProps> = ({
  placeholder,
  lable,
  type = "text",
  icon,
  ...rest
}) => {
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
        <input
          type={type}
          {...rest}
          placeholder={placeholder}
          className="w-full p-2 flex-1  rounded-l-md border-r-[2px] border-secondary-700 "
        />
      </div>
    </div>
  );
};

export default Input;
