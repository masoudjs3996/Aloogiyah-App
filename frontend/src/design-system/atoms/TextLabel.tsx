"use client";
import { FC, PropsWithChildren } from "react";

interface TextLabelProps {
  className?: string;
}

export const TextLabel: FC<PropsWithChildren<TextLabelProps>> = ({
  children,
  className,
}) => {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>;
};
