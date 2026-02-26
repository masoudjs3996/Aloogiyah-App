"use client";
import { FC, useState } from "react";
import Link from "next/link";
import IconButton from "../../atoms/IconButton";
import { usePathname, useRouter } from "next/navigation";
import { TiShoppingCart } from "react-icons/ti";
import { FaLeaf } from "react-icons/fa";
import { BiMenu, BiX } from "react-icons/bi";

const HeaderTop: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const navLinks = [
    { id: 1, href: "/", label: "خانه" },
    { id: 2, href: "/categories", label: "دسته بندی" },
    { id: 3, href: "/product", label: "محصولات" },
    { id: 4, href: "/farm", label: "مزارع" },
    { id: 5, href: "/contact", label: "تماس با ما" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="container-custom flex h-16 items-center justify-between md:h-20">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-md p-2 text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <BiX className="h-7 w-7" />
          ) : (
            <BiMenu className="h-7 w-7" />
          )}
        </button>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green">
            <FaLeaf className="h-6 w-6 text-green_foreground " />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            الو گیاه
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-accent text-accent_foreground"
                  : "text-muted_foreground hover:bg-accent hover:text-accent_foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/checkout/card"
          className=" rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/90 inline-flex"
        >
          <IconButton icon={<TiShoppingCart className="w-6 h-7 " />} />
        </Link>
      </div>
      {/* mobile nav */}
      {isMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="container-custom flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-md px-4 py-3 text-base font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-accent text-accent_foreground"
                    : "text-muted_foreground hover:bg-accent"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default HeaderTop;


// "use client";
// import { FC, useState } from "react";
// import IconButton from "../../atoms/IconButton";
// import { IoMdMenu } from "react-icons/io";
// import { TiShoppingCart } from "react-icons/ti";
// import Link from "next/link";
// import { IoCloseOutline } from "react-icons/io5";
// import { useRouter } from "next/navigation";
// import { useSelector } from "react-redux";
// import useLogout from "@/shared/hooks/useLogout";

// const HeaderTop: FC = () => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const router = useRouter();
//   const user = useSelector((state: any) => state.user.data);
//   const logout = useLogout();

//   const links = [
//     { href: "/dashboard", label: "داشبورد" },
//     { href: "/profile", label: "پروفایل" },
//     { href: "/orders", label: "سفارش‌ها" },
//     { href: "/contact", label: "تماس با ما" },
//   ];

//   const handleAuthClick = async () => {
//     setIsMenuOpen(false);

//     if (user) {
//       await logout();
//     } else {
//       router.push("/Login");
//     }
//   };

//   return (
//     <div className="relative">
//       <div className="flex justify-between items-center px-4 py-3 bg-white shadow-md">
//         <IconButton
//           icon={
//             isMenuOpen ? (
//               <IoCloseOutline className="w-6 h-6" />
//             ) : (
//               <IoMdMenu className="w-6 h-6" />
//             )
//           }
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//         />

//         <p className="font-bold text-lg">LOGO</p>

//         <IconButton
//           onClick={() => router.push("/checkout/card")}
//           icon={<TiShoppingCart className="w-6 h-6" />}
//         />
//       </div>

//       <div
//         className={`absolute top-full left-0 w-full bg-white shadow-md flex flex-col p-4 space-y-2 z-50 overflow-hidden transition-all duration-300 ${
//           isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
//         }`}
//       >
//         <p
//           onClick={handleAuthClick}
//           className="text-gray-700 hover:text-blue-500 cursor-pointer"
//         >
//           {user ? "خروج" : "ورود"}
//         </p>

//         {links.map((link) => (
//           <Link
//             key={link.href}
//             href={link.href}
//             className="text-gray-700 hover:text-blue-500"
//             onClick={() => setIsMenuOpen(false)}
//           >
//             {link.label}
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default HeaderTop;