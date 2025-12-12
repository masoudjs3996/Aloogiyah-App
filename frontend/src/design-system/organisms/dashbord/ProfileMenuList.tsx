import { MenuItem } from "@molecules/dashbord/MenuItem";
import { SlEnvolopeLetter } from "react-icons/sl";
import { IoPricetagOutline, IoWalletOutline } from "react-icons/io5";
import Link from "next/link";
import Button from "@/design-system/atoms/Button";

const userItem = [
  {
    icon: IoPricetagOutline,
    title: "تخفیف و جایزه شما",
    href: "/dashboard/profile/rewards",
  },
  { icon: IoWalletOutline, title: "کیف پول " },
  { icon: SlEnvolopeLetter, title: "پیام ها" },
];
export const ProfileMenuList = ({ items }: any) => (
  <div className="px-4  space-y-2 w-full">
    {userItem.map((item: any, i: number) =>
      item.href ? (
        <Link key={i} href={item.href}>
          <MenuItem {...item} />
        </Link>
      ) : (
        <MenuItem key={i} {...item} />
      )
    )}
    <div className="h-[2px] bg-secondary-400 w-full my-4"> </div>
    {items.map((item: any, i: number) => (
      <MenuItem key={i} {...item} />
    ))}
    <div className="w-full py-4 flex justify-end items-center">
      <Link href={"/dashboard/farm/registerFarm"}>
        <Button variant="success">مزرعه خودتان را ثبت کنید</Button>
      </Link>
    </div>
  </div>
);
