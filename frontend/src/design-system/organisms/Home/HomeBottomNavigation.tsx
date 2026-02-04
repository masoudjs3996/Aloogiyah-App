"use client";
import { BottomNavBar } from "@/design-system/molecules/public";
import { FC } from "react";
import { BiCategory } from "react-icons/bi";
import { FaUser, FaShoppingCart, FaInfoCircle, FaHome } from "react-icons/fa";
const HomeBottomNavigation: FC = () => {
  const navItems = [
    { href: "/profile", icon: FaUser, label: "حساب کاربری" },
    {
      href: "/categories",
      icon: BiCategory,
      label: "دسته بندی ها ",
    },
    { href: "/dashboard/cart", icon: FaShoppingCart, label: "سبد خرید" },
    { href: "/dashboard/latest", icon: FaInfoCircle, label: "آخرین محصولات" },
    { href: "/", icon: FaHome, label: "خانه" },
  ];
  return <BottomNavBar navItems={navItems} />;
};

export default HomeBottomNavigation;
