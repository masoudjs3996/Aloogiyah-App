import { FaHome, FaUser } from "react-icons/fa";
import { GiFarmer } from "react-icons/gi";
import {
  IoPricetagOutline,
  IoStorefrontSharp,
  IoWalletOutline,
} from "react-icons/io5";

export const dashboardMenu = [
<<<<<<< HEAD
  {
    path: "/",
    icon: FaHome,
    label: "خانه",
    roles: ["Admin", "User", "Buyer", "Manager", "Farmer"],
  },
=======
    {
        path: "/",
        icon: FaHome,
        label: "خانه",
        roles: ["Admin", "User", "Manager", "Farmer", "Buyer"]
    },
>>>>>>> f9b620d26db82ed1ded71f658dae6fc2ebb8f57c
  {
    path: "/dashboard/farm/myFarms",
    icon: GiFarmer,
    label: "مزرعه ها ",
<<<<<<< HEAD
    roles: ["Admin", "User", "Farmer"],
=======
      roles: ["Admin", "Manager", "Farmer"],
>>>>>>> f9b620d26db82ed1ded71f658dae6fc2ebb8f57c
  },
  {
    path: "/dashboard/profile",
    icon: FaUser,
    label: "حساب کاربری",
<<<<<<< HEAD
    roles: ["Admin", "Farmer"],
=======
      roles: ["Admin", "User", "Manager", "Farmer", "Buyer"],
>>>>>>> f9b620d26db82ed1ded71f658dae6fc2ebb8f57c
  },
  {
    path: "/dashboard/farm/registerFarm",
    icon: IoStorefrontSharp,
    label: "ثبت مزرعه ",
      roles: ["Admin", "Manager", "Farmer" ],
  },
  {
    label: "تخفیف های شما",
    icon: IoPricetagOutline,
    path: "/dashboard/profile/rewards",
<<<<<<< HEAD
    roles: ["Admin", "Buyer", "User"],
=======
      roles: ["Admin", "User", "Manager", "Farmer", "Buyer"],
>>>>>>> f9b620d26db82ed1ded71f658dae6fc2ebb8f57c
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
