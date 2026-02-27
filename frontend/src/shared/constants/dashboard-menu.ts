import { BsBarChart } from "react-icons/bs";
import { FaHome, FaUser } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { GiFarmer } from "react-icons/gi";
import {
  IoPricetagOutline,
  IoStorefrontSharp,
  IoWalletOutline,
} from "react-icons/io5";

export const dashboardMenu = [
  { path: "/", icon: FaHome, label: "خانه", roles: ["admin", "user"] },
  {
    path: "/dashboard/farm/myFarms",
    icon: GiFarmer,
    label: "مزرعه ها ",
    roles: ["Admin", "user"],
  },
  {
    path: "/dashboard/profile",
    icon: FaUser,
    label: "حساب کاربری",
    roles: ["Admin"],
  },
  {
    path: "/dashboard/farm/registerFarm",
    icon: IoStorefrontSharp,
    label: "ثبت مزرعه ",
    roles: ["Admin", "user"],
  },
  {
    label: "تخفیف های شما",
    icon: IoPricetagOutline,
    path: "/dashboard/profile/rewards",
    roles: ["Admin", "user"],
  },

  {
    path: "/dashboard/profile/wallet",
    icon: IoWalletOutline,
    label: "کیف پول",
    roles: ["Admin", "user"],
  },
];
