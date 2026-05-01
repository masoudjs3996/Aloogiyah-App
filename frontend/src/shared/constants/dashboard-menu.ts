import { FaHome, FaUser } from "react-icons/fa";
import { GiFarmer } from "react-icons/gi";
import {
  IoPricetagOutline,
  IoStorefrontSharp,
  IoWalletOutline,
} from "react-icons/io5";

export const dashboardMenu = [
  {
    path: "/",
    icon: FaHome,
    label: "خانه",
    roles: ["Admin", "User", "Buyer", "Manager", "Farmer"],
  },
  {
    path: "/",
    icon: FaHome,
    label: "خانه",
    roles: ["Admin", "User", "Manager", "Farmer", "Buyer"],
  },
  {
    path: "/dashboard/farm/myFarms",
    icon: GiFarmer,
    label: "مزرعه ها ",
    roles: ["Admin", "User", "Farmer"],
  },
  {
    path: "/dashboard/profile",
    icon: FaUser,
    label: "حساب کاربری",

    roles: ["Admin", "User", "Manager", "Farmer", "Buyer"],
  },
  {
    path: "/dashboard/farm/registerFarm",
    icon: IoStorefrontSharp,
    label: "ثبت مزرعه ",
    roles: ["Admin", "Manager", "Farmer"],
  },
  {
    label: "تخفیف های شما",
    icon: IoPricetagOutline,
    path: "/dashboard/profile/rewards",
    roles: ["Admin", "Buyer", "User"],
  },

  {
    path: "/dashboard/profile/wallet",
    icon: IoWalletOutline,
    label: "کیف پول",
    roles: ["Admin", "Manager", "Farmer", "User", "Buyer"],
  },
  {
    path: "",
    icon: IoWalletOutline,
    label: "فاکتور ها",
    roles: ["Admin", "Manager", "Farmer", "Buyer"],
  },
];
