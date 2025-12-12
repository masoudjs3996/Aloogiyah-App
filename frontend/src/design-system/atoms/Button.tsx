"use client";
import { ButtonHTMLAttributes, FC, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "yellow" | "success" | "warning";
  onClick?: () => void;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  ...rest
}) => {
  const base = "px-2 py-1 rounded-md font-bold  shadow-lg w-full";

  const styles = {
    primary: "bg-primary-900 text-white hover:bg-primary-800",
    secondary: "bg-secondary-100 text-primary-900 hover:bg-secondary-200",
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
