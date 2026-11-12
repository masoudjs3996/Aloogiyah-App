"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextField } from "@/design-system/molecules/public";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import useUpdateProfile from "@/hooks/mutations/useUpdateProfile";
import toast from "react-hot-toast";
import { FaRegUser } from "react-icons/fa6";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { ProfileContactField } from "./ProfileContactField";
import type { IUser } from "@/shared/types/user";
import { useEffect } from "react";

const schema = yup.object().shape({
  firstName: yup.string().required("نام الزامی است"),
  lastName: yup.string().required("نام خانوادگی الزامی است"),
  phone: yup
    .string()
    .defined().trim().matches(/^09\d{9}$/, { message: "شماره موبایل معتبر نیست", excludeEmptyString: true }),
  email: yup.string().defined().trim().email("ایمیل معتبر نیست"),
});

export const EditProfileForm = ({ user }: { user?: Partial<IUser> }) => {
  const { editUser } = useUpdateProfile();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    resolver: yupResolver(schema),
  });

  const fName = user?.fName || "";
  const lName = user?.lName || "";
  const email = user?.email || "";
  const phoneNumber = String(user?.phoneNumber || "");
  useEffect(() => {
    reset({ firstName: fName, lastName: lName, email, phone: phoneNumber });
  }, [fName, lName, email, phoneNumber, reset]);

  const onSubmit = (data: yup.InferType<typeof schema>) => {
    editUser.mutate(
      {
        fName: data.firstName,
        lName: data.lastName,
        email: data.email || null,
        phoneNumber: data.phone || null,
      },
      {
        onSuccess: (data) => {
          toast.success(data?.message || "فرم با موفقیت ارسال شد ");
        },
        onError: (err) => {
          console.error("Upload failed:", err);
          toast.error("خطا در ارسال فرم ");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Controller
          name="firstName"
          control={control}
          render={({ field }) => (
            <TextField
              label="نام :"
              placeholder="نام را وارد کنید"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.firstName?.message}
              icon={<FaRegUser size={24} className="text-slate-700" />}
              className="w-full"
            />
          )}
        />

        <Controller
          name="lastName"
          control={control}
          render={({ field }) => (
            <TextField
              placeholder="نام خانوادگی را وارد کنید"
              label="نام خانوادگی"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.lastName?.message}
              icon={
                <MdDriveFileRenameOutline
                  size={24}
                  className="text-slate-700"
                />
              }
              className="w-full"
            />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <ProfileContactField key={email} kind="email" savedValue={email}
              confirmed={user?.isEmailConfirmed === true} saving={editUser.isPending}
              value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.email?.message} />
          )}
        />

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <ProfileContactField key={phoneNumber} kind="phone" savedValue={phoneNumber}
              confirmed={user?.isPhoneConfirmed === true} saving={editUser.isPending} readOnly={user?.isPhoneOnly === true}
              value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.phone?.message} />
          )}
        />

        <div className="flex items-end">
          <ActionButton type="submit" busy={editUser.isPending}>
            ذخیره تغییرات
          </ActionButton>
        </div>
      </div>
    </form>
  );
};
