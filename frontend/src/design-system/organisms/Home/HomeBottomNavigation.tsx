"use client";
import { BottomNavBar } from "@/design-system/molecules/public";
import {
  FiHome,
  FiShoppingBag,
  FiGrid,
  FiSend,
  FiLayers,
} from "react-icons/fi";
export default function HomeBottomNavigation() {
  return (
    <BottomNavBar
      navItems={[
        { href: "/", icon: FiHome, label: "خانه" },
        { href: "/product", icon: FiShoppingBag, label: "آگهی‌ها" },
        { href: "/categories", icon: FiGrid, label: "دسته‌بندی" },
        { href: "/dashboard/inquiries", icon: FiSend, label: "درخواست‌ها" },
        { href: "/dashboard", icon: FiLayers, label: "داشبورد" },
      ]}
    />
  );
}
