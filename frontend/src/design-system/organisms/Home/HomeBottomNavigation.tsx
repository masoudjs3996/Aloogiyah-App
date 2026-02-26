"use client";
import { BottomNavBar } from "@/design-system/molecules/public";
import { FC } from "react";
import { BiCategory } from "react-icons/bi";
import { FaUser, FaShoppingCart, FaInfoCircle, FaHome } from "react-icons/fa";
import { useSelector } from "react-redux";
const HomeBottomNavigation: FC = () => {
  const user = useSelector((state: any) => state.user.data);
  const navItems = [
    {
      href: "/dashboard/profile",
      icon: FaUser,
      label: user !== null ? user?.userName : "حساب کاربری",
    },
    {
      href: "/categories",
      icon: BiCategory,
      label: "دسته بندی ها ",
    },
    { href: "/checkout/card", icon: FaShoppingCart, label: "سبد خرید" },
    { href: "/dashboard/latest", icon: FaInfoCircle, label: "آخرین محصولات" },
    { href: "/", icon: FaHome, label: "خانه" },
  ];
  return <BottomNavBar navItems={navItems} />;
};

export default HomeBottomNavigation;
