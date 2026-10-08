"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextField } from "@/design-system/molecules/public";
import Button from "@/design-system/atoms/Button";
import useUpdateProfile from "@/hooks/mutations/useUpdateProfile";
import toast from "react-hot-toast";
import { FaRegUser } from "react-icons/fa6";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { MdOutlineMailOutline } from "react-icons/md";
import { AiOutlinePhone } from "react-icons/ai";
import { useEffect } from "react";

const schema = yup.object().shape({
  firstName: yup.string().required("نام الزامی است"),
  lastName: yup.string().required("نام خانوادگی الزامی است"),
  phone: yup
    .string()
    .matches(/^09\d{9}$/, "شماره موبایل معتبر نیست")
    .required("شماره موبایل لازم است"),
  email: yup.string().required("ایمیل الزامی است").email("ایمیل معتبر نیست"),
});

export const EditProfileForm = ({
  file,
  user,
}: {
  file: File | null;
  user: any;
}) => {
  const { editUser, uploadImage } = useUpdateProfile();

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

  useEffect(() => {
    if (user) {
      reset({
        firstName: user?.fName || "",
        lastName: user?.lName || "",
        email: user?.email || "",
        phone: user?.phoneNumber || "",
      });
    }
  }, [user, reset]);

  const onSubmit = (data: any) => {
    editUser.mutate(
      {
        fName: data.firstName,
        lName: data.lastName,
        email: data.email,
        phoneNumber: data.phone,
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
    file &&
      uploadImage.mutate(file, {
        onSuccess: (data) => {
          toast.success(data?.message || "فرم با موفقیت ارسال شد ");
        },
        onError: (err) => {
          console.error("Upload failed:", err);
          toast.error("خطا در ارسال فرم ");
        },
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
            <TextField
              placeholder=" ایمیل را وارد کنید "
              label="ایمیل :"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
              icon={
                <MdOutlineMailOutline size={24} className="text-slate-700" />
              }
            />
          )}
        />

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <TextField
              placeholder="شماره همراه را وارد کنید "
              label="شماره همراه :"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.phone?.message}
              icon={<AiOutlinePhone size={24} className="text-slate-700" />}
            />
          )}
        />

        <div className="flex items-end">
          <Button type="submit">ذخیره تغییرات</Button>
        </div>
      </div>
    </form>
  );
};
