"use client";
import { FC, useState } from "react";
import Link from "next/link";
import IconButton from "../../atoms/IconButton";
import { usePathname, useRouter } from "next/navigation";
import { TiShoppingCart } from "react-icons/ti";
import { FaLeaf } from "react-icons/fa";
import { BiMenu, BiX } from "react-icons/bi";
import { useSelector } from "react-redux";
import useLogout from "@/shared/hooks/useLogout";

const HeaderTop: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const user = useSelector((state: any) => state.user.data);
  const logout = useLogout();
  const pathname = usePathname();
  const navLinks = [
    { id: 1, href: "/", label: "خانه" },
    { id: 2, href: "/categories", label: "دسته بندی" },
    { id: 3, href: "/product", label: "محصولات" },
    { id: 4, href: "/farm", label: "مزارع" },
    { id: 6, href: "/dashboard", label: "داشبورد" },
    { id: 5, href: "/contact", label: "تماس با ما" },
   
  ];
const handleAuthClick = async () => {
    setIsMenuOpen(false);

    if (user) {
      await logout();
    } else {
      router.push("/Login");
    }
  };
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
            <p
          onClick={handleAuthClick}
          className="rounded-md px-4 py-3 text-base font-medium transition-colors text-muted_foreground hover:bg-accent"
        >
          {user ? "خروج" : "ورود"}
        </p>
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