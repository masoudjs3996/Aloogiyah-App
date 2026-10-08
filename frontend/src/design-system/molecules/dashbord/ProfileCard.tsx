"use client";

import { useEffect, useState } from "react";

import { SmallText, Text, Title } from "@/design-system/atoms/Typography";
import { ProfileImageUploader } from "./ProfileImageUploader";
import { BiLeaf } from "react-icons/bi";
import { LiaCalendarDaySolid } from "react-icons/lia";
import { BsShieldCheck } from "react-icons/bs";
import { EditProfileForm } from "@/design-system/organisms/dashbord/EditProfileForm";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { getPersianRole } from "@/shared/utils/roleUtils";

export const ProfileCard = ({ user }: { user: any }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleImage = (file: File) => {
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setFile(file);
  };

  useEffect(() => {
    const defaultImage = getImageUrl(user?.profileImageUrl);
    setImagePreview(defaultImage);
  }, [user]);

  const formatPersianDate = (dateString: string): string => {
    if (!dateString) return "نامشخص";

    const date = new Date(dateString);

    const persianDate = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);

    return persianDate;
  };
  const memberSince = user?.createdAt
    ? formatPersianDate(user.createdAt)
    : " نامشخص";
  return (
    <div>
      <div
        dir="rtl"
        className="
        relative
        m-4
        overflow-hidden
        rounded-2xl
        bg-white
        shadow-sm
      "
      >
        <div className="relative h-[120px] w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
            alt="cover"
            className="h-full w-full object-cover"
          />

          <div
            className="
            absolute
            inset-x-0
            bottom-0
            h-16
            bg-gradient-to-t
            from-white
            to-transparent
          "
          />
        </div>

        <div className="relative px-8 pb-5">
          <div className="absolute -top-14 right-8">
            <div className="relative">
              <ProfileImageUploader
                image={imagePreview}
                onChange={handleImage}
              />
            </div>
          </div>
          <div className="mr-0 min-h-[130px] pt-12 sm:mr-[145px] sm:min-h-[120px] sm:pt-1">
            <Title>{user?.fName || "نام ثبت نشده"}</Title>

            <Text>{getPersianRole(user?.roleName || "نامشخص")}</Text>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500">
              <span>{user?.email || "ایمیل ثبت نشده"}</span>

              <span className="text-gray-300">|</span>

              <span>{user?.phoneNumber || "شماره همراه ثبت نشده"}</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                <LiaCalendarDaySolid size={25} className="text-green-600" />
              </div>

              <div>
                <SmallText>عضویت از</SmallText>

                <Text>{memberSince}</Text>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                <BiLeaf size={25} className="text-green-600" />
              </div>

              <div>
                <SmallText>نام کاربری</SmallText>

                <Text>{user?.userName || "ثبت نشده"}</Text>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
                <BsShieldCheck size={25} className="text-green-600" />
              </div>

              <div>
                <SmallText>نقش کاربری</SmallText>

                <Text>{getPersianRole(user?.roleName || "نامشخص")}</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-5">
        <EditProfileForm file={file} user={user} />
      </div>
    </div>
  );
};
