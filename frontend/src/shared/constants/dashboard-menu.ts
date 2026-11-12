import { FaHome, FaUser } from "react-icons/fa";
import { GiFarmer } from "react-icons/gi";
import { IoStorefrontSharp } from "react-icons/io5";
import { FiBookmark, FiCheckCircle, FiMessageSquare, FiShoppingBag, FiGrid, FiSend } from "react-icons/fi";
const everyone = ["User", "Buyer", "Farmer", "Expert", "Provider", "Admin", "Manager", "DeliveryAgent"];
const commerceMode = process.env.NEXT_PUBLIC_MARKETPLACE_MODE === "Commerce";
export const dashboardMenu = [
 { path: "/dashboard", icon: FiGrid, label: "داشبورد", roles: everyone },
 { path: "/", icon: FaHome, label: "فروشگاه", roles: everyone },
 { path: "/dashboard/saved", icon: FiBookmark, label: "ذخیره‌ها", roles: everyone },
 { path: "/dashboard/inquiries", icon: FiSend, label: "درخواست‌های خرید", roles: everyone },
 ...(commerceMode ? [{ path: "/dashboard/orders", icon: FiShoppingBag, label: "سفارش‌ها", roles: everyone }, { path: "/dashboard/deliveries", icon: FiShoppingBag, label: "محموله‌های تحویل من", roles: ["DeliveryAgent", "Admin", "Manager"] }, { path: "/dashboard/sales", icon: FiShoppingBag, label: "مشتریان و فروش من", roles: ["Farmer"] }] : []),
 { path: "/dashboard/chat", icon: FiMessageSquare, label: "گفت‌وگوها", roles: everyone },
 { path: "/dashboard/farm/myFarms", icon: GiFarmer, label: "مزرعه‌های من", roles: ["Farmer", "Manager"] },
 { path: "/dashboard/farm/registerFarm", icon: IoStorefrontSharp, label: "ثبت مزرعه", roles: ["Farmer", "Manager"] },
 { path: "/dashboard/business", icon: FiCheckCircle, label: "درخواست همکاری", roles: everyone },
 { path: "/dashboard/profile", icon: FaUser, label: "حساب کاربری", roles: everyone },
 ...(commerceMode ? [{ path: "/dashboard/profile/rewards", icon: FiShoppingBag, label: "تخفیف‌های شما", roles: everyone }, { path: "/dashboard/profile/wallet", icon: FiShoppingBag, label: "کیف پول", roles: everyone }, { path: "/dashboard/profile/settlements", icon: FiShoppingBag, label: "حساب مالی و تسویه", roles: everyone }] : []),
];

export const dashboardMenuForRoles = (roles: readonly string[]) =>
  dashboardMenu.filter((item) => roles.includes("Manager") || item.roles.some((role) => roles.includes(role)));
