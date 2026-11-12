"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProfileImageUploader } from "./ProfileImageUploader";
import { BiLeaf } from "react-icons/bi";
import { LiaCalendarDaySolid } from "react-icons/lia";
import { BsShieldCheck } from "react-icons/bs";
import AccountSecurityForms from "@/design-system/organisms/dashbord/AccountSecurityForms";
import { EditProfileForm } from "@/design-system/organisms/dashbord/EditProfileForm";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import useUpdateProfile from "@/hooks/mutations/useUpdateProfile";
import { errorMessage } from "@/lib/actions/platform";
import toast from "react-hot-toast";
import type { IUser } from "@/shared/types/user";
import { getPersianRole } from "@/shared/utils/roleUtils";

export const ProfileCard = ({ user }: { user?: Partial<IUser> }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { uploadImage } = useUpdateProfile();
  const handleImage = (selectedFile: File) => {
    if (uploadImage.isPending) return;
    setFile(selectedFile);
    uploadImage.mutate(selectedFile, {
      onSuccess: () => {
        setFile(null);
        toast.success("عکس پروفایل ذخیره شد.");
      },
      onError: (error) => {
        setFile(null);
        toast.error(errorMessage(error));
      },
    });
  };

  useEffect(() => {
    if (!file) {
      setImagePreview(null);
      return;
    }
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  const formatPersianDate = (dateString: string): string => {
    if (!dateString) return "نامشخص";

    const date = new Date(dateString);

    const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
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
    <div className="space-y-5">
      <section dir="rtl" aria-label="خلاصه حساب کاربری" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-5 border-b border-emerald-100 bg-emerald-50/60 p-5 text-center sm:flex-row sm:p-6 sm:text-right">
          <div className="shrink-0 rounded-2xl border border-emerald-100 bg-white p-3">
            <ProfileImageUploader
              image={imagePreview || getImageUrl(user?.profileImageUrl ?? undefined)}
              busy={uploadImage.isPending}
              onChange={handleImage}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-bold text-slate-900">{[user?.fName, user?.lName].filter(Boolean).join(" ") || "نام ثبت نشده"}</h2>

            <p className="break-words text-sm font-medium text-slate-700">{getPersianRole(user?.roleName || "نامشخص")}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 break-all text-sm text-slate-500 sm:justify-start">
              <span>{user?.email || "ایمیل ثبت نشده"}</span>

              <span className="text-gray-300">|</span>

              <span>{user?.phoneNumber || "شماره همراه ثبت نشده"}</span>
            </div>
          </div>

        </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <LiaCalendarDaySolid size={25} className="text-emerald-600" />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-xs text-slate-500">عضویت از</p>

                <p className="break-words text-sm font-medium text-slate-700">{memberSince}</p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <BiLeaf size={25} className="text-emerald-600" />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-xs text-slate-500">{user?.isPhoneOnly ? "روش ورود" : "نام کاربری"}</p>

                <p className="break-words text-sm font-medium text-slate-700">{user?.isPhoneOnly ? "شماره موبایل و کد پیامکی" : user?.userName || "ثبت نشده"}</p>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <BsShieldCheck size={25} className="text-emerald-600" />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-xs text-slate-500">نقش کاربری</p>

                <p className="break-words text-sm font-medium text-slate-700">{getPersianRole(user?.roleName || "نامشخص")}</p>
              </div>
            </div>
          </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">
          اطلاعات حساب
        </h2>
        <EditProfileForm user={user} />
      </section>
      <AccountSecurityForms phoneOnly={user?.isPhoneOnly === true} phoneNumber={String(user?.phoneNumber || "")} />
      <section className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <h2 className="text-lg font-bold text-slate-900">درخواست همکاری</h2>
        <p className="text-sm leading-7 text-slate-600">برای فعالیت به‌عنوان کشاورز یا مغازه‌دار، مدارک را ارسال کنید یا وضعیت درخواستتان را ببینید.</p>
        <Link href="/dashboard/business" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white">ثبت و پیگیری درخواست</Link>
      </section>
    </div>
  );
};
