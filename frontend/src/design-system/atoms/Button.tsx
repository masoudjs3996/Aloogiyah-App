"use client";
import { ButtonHTMLAttributes, FC, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "yellow" | "success" | "warning";
  onClick?: () => void;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = "secondary",
  onClick,
  ...rest
}) => {
  const base =
    "px-2 h-12 flex justify-center items-center gap-x-1 py-1 rounded-md font-bold  shadow-lg w-full";

  const styles = {
    primary: "bg-primary-900 text-white hover:bg-primary-800",
    secondary: "bg-secondary-700 text-white",
    yellow: "bg-warning text-black hover:bg-warning/80",
    success: "bg-success text-white hover:bg-success/80",
    warning: "bg-warning text-black hover:bg-warning/80",
  };

  return (
    <button
      {...rest}
      onClick={onClick}
      className={`${base} ${styles[variant]}`}
    >
      {children}
    </button>
  );
};

export default Button;
