"use client";
import { FC, ReactNode } from "react";

interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
}

const IconButton: FC<IconButtonProps> = ({ icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full  hover:bg-gray-100 transition"
    >
      {icon}
    </button>
  );
};

export default IconButton;
