"use client";
import React from "react";

interface TagFilterProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  label,
  active,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1 rounded-full border text-sm
        ${
          active
            ? "bg-primary-100 border-primary-500 text-primary-700"
            : "bg-white border-gray-300 text-gray-600"
        }
      `}
    >
      {label}
    </button>
  );
};
