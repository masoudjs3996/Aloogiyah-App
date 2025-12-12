"use client";
import { FC, PropsWithChildren } from "react";

interface CardContainerProps {
  className?: string;
}

export const CardContainer: FC<PropsWithChildren<CardContainerProps>> = ({
  children,
  className,
}) => {
  return (
    <div className={`rounded-xl border p-4 shadow-sm bg-white ${className}`}>
      {children}
    </div>
  );
};
