"use client";
import { FC, useState } from "react";
import IconButton from "../../atoms/IconButton";
import { IoMdMenu } from "react-icons/io";
import { TiShoppingCart } from "react-icons/ti";
import Link from "next/link";
import { IoCloseOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

const HeaderTop: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const links = [
    { href: "/dashboard", label: "داشبورد" },
    { href: "/profile", label: "پروفایل" },
    { href: "/orders", label: "سفارش‌ها" },
    { href: "/contact", label: "تماس با ما" },
  ];

  return (
    <div className="relative">
      <div className="flex justify-between items-center px-4 py-3 bg-white shadow-md">
        <IconButton
          icon={
            isMenuOpen ? (
              <IoCloseOutline className="w-6 h-6" />
            ) : (
              <IoMdMenu className="w-6 h-6" />
            )
          }
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        />

        <p className="font-bold text-lg">LOGO</p>

        <IconButton
          onClick={() => router.push("/checkout/card")}
          icon={<TiShoppingCart className="w-6 h-6 " />}
        />
      </div>
      <div
        className={`absolute top-full left-0 w-full bg-white shadow-md flex flex-col p-4 space-y-2 z-50 overflow-hidden transition-all duration-300 ${
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-700 hover:text-blue-500"
            onClick={() => setIsMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HeaderTop;
