"use client";

import { useEffect, useState } from "react";

import { getUserInfo } from "@/lib/actions/profile";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { FiSettings } from "react-icons/fi";
import { BiHelpCircle } from "react-icons/bi";
import { ProfileCard } from "@/design-system/molecules/dashbord/ProfileCard";
import { ProfileMenuList } from "@/design-system/organisms/dashbord/ProfileMenuList";
import { IoGiftOutline } from "react-icons/io5";
import { MdOutlineChecklistRtl } from "react-icons/md";

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const res = await getUserInfo();
      const user = res?.data ?? null;
      if (!user) {
        setUserInfo(null);
        return;
      }
      user.profileImageUrl = user.profileImageUrl
        ? getImageUrl(user.profileImageUrl)
        : null;

      setUserInfo(user);
    };

    getUser();
  }, []);

  const menuItems = [
    {
      icon: FiSettings,
      title: " تنظیمات",
    },
    { icon: BiHelpCircle, title: " راهنمای الو گیاه" },
    {
      icon: IoGiftOutline,
      title: " دعوت از دوستان",
    },
    {
      icon: ShieldCheckIcon,
      title: "درباره الو گیاه",
    },
    {
      icon: MdOutlineChecklistRtl,
      title: "قوانین و شرایط اپلیکیشن",
    },
  ];

  if (!userInfo) return null;

  return (
    <div className="min-h-screen flex flex-col justify-between  gap-y-4">
      <div>
        <ProfileCard user={userInfo} />
      </div>
      <ProfileMenuList items={menuItems} />
    </div>
  );
}
