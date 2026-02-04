"use client";
import { BottomNavBar } from "@/design-system/molecules/public";
import { FC } from "react";
import { FaHome, FaUser } from "react-icons/fa";
import { GiFarmer } from "react-icons/gi";
import { BsBarChart } from "react-icons/bs";
import { IoStorefrontSharp } from "react-icons/io5";
const DashboardBottomNavigation: FC = () => {
  const navItems = [
    { href: "/profile", icon: FaUser, label: "حساب کاربری" },
    { href: "/dashboard/farm/myFarms", icon: GiFarmer, label: "مزرعه ها " },
    {
      href: "/dashboard/store",
      icon: IoStorefrontSharp,
      label: "فروشگاه",
    },
    { href: "/dashboard/latest", icon: BsBarChart, label: "آمار" },
    { href: "/", icon: FaHome, label: "خانه" },
  ];
  return <BottomNavBar navItems={navItems} />;
};

export default DashboardBottomNavigation;
