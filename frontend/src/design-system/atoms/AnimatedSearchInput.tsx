import { useState } from "react";
import { BiSearch } from "react-icons/bi";

type AnimatedSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const AnimatedSearchInput = ({ value, onChange }: AnimatedSearchInputProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`
        relative flex items-center border rounded-full h-8 
        transition-all duration-300 ease-in-out overflow-hidden
        ${open ? "w-52 px-1" : "w-8 px-1"}
      `}
    >
      {/* Input */}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`
          bg-transparent text-sm pr-1
          transition-all duration-300 ease-in-out
          focus:outline-none
          ${open ? "w-full max-w-[90%] opacity-100" : "w-0 opacity-0"}
        `}
      />

      {/* Icon */}
      <BiSearch
        onClick={() => setOpen(true)}
        className={`
          absolute right-2 w-4 h-4 text-gray-500 cursor-pointer
          transition-transform duration-300 ease-in-out
          ${open ? "-translate-x-44" : "translate-x-0"}
        `}
      />
    </div>
  );
};

export default AnimatedSearchInput;
