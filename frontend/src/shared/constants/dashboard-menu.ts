import { FaHome, FaUser } from "react-icons/fa";
import { GiFarmer } from "react-icons/gi";
import { IoPricetagOutline, IoStorefrontSharp, IoWalletOutline } from "react-icons/io5";
import { FiTool, FiCheckCircle, FiMessageSquare, FiBookOpen, FiMapPin, FiShoppingBag, FiZap, FiGrid } from "react-icons/fi";
const everyone = ["Admin", "User", "Buyer", "Manager", "Farmer", "Expert", "Provider"];
export const dashboardMenu = [
 { path: "/dashboard", icon: FiGrid, label: "داشبورد", roles: everyone },
 { path: "/", icon: FaHome, label: "فروشگاه", roles: everyone },
 { path: "/dashboard/orders", icon: FiShoppingBag, label: "سفارش‌ها", roles: everyone },
 { path: "/dashboard/services", icon: FiTool, label: "خدمات گیاه", roles: everyone },
 { path: "/dashboard/quality", icon: FiCheckCircle, label: "تعیین کیفیت", roles: everyone },
 { path: "/dashboard/chat", icon: FiMessageSquare, label: "گفت‌وگوها", roles: everyone },
 { path: "/dashboard/auctions", icon: FiZap, label: "حراجی", roles: everyone },
 { path: "/dashboard/articles", icon: FiBookOpen, label: "مقالات", roles: everyone },
 { path: "/dashboard/farm/myFarms", icon: GiFarmer, label: "مزرعه‌های من", roles: ["Admin", "Manager", "Farmer"] },
 { path: "/dashboard/farm/registerFarm", icon: IoStorefrontSharp, label: "ثبت مزرعه", roles: ["Admin", "Manager", "Farmer"] },
 { path: "/dashboard/addresses", icon: FiMapPin, label: "آدرس‌ها", roles: everyone },
 { path: "/dashboard/profile", icon: FaUser, label: "حساب کاربری", roles: everyone },
 { path: "/dashboard/profile/rewards", icon: IoPricetagOutline, label: "تخفیف‌های شما", roles: everyone },
 { path: "/dashboard/profile/wallet", icon: IoWalletOutline, label: "کیف پول", roles: everyone },
];
