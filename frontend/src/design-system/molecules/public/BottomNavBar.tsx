"use client";
import NavItem from "@/design-system/atoms/NavItem";
import { FC } from "react";
import { IconType } from "react-icons";
export interface INavItem {
  href: string;
  icon: IconType;
  label: string;
}
interface BottomNavBarProps {
  navItems: INavItem[];
}
const BottomNavBar: FC<BottomNavBarProps> = ({ navItems }) => {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner p-2 flex justify-around items-center fixed bottom-0 w-full z-50 ">
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          icon={item.icon}
          label={item.label}
        />
      ))}
    </footer>
  );
};

export default BottomNavBar;
