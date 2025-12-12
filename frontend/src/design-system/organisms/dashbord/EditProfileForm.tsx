"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ProfileImageUploader } from "@/design-system/molecules/dashbord/ProfileImageUploader";
import { TextField } from "@/design-system/molecules/public";
import Button from "@/design-system/atoms/Button";
import useUpdateProfile from "@/hooks/mutations/useUpdateProfile";
import toast from "react-hot-toast";

const schema = yup.object().shape({
  firstName: yup.string().required("نام الزامی است"),
  lastName: yup.string().required("نام خانوادگی الزامی است"),
  phone: yup
    .string()
    .matches(/^09\d{9}$/, "شماره موبایل معتبر نیست")
    .required("شماره موبایل لازم است"),
  email: yup.string().required("ایمیل الزامی است").email("ایمیل معتبر نیست"),
  age: yup
    .number()
    .typeError("سن باید عدد باشد")
    .required("سن لازم است")
    .min(18, "سن نباید کمتر از ۱۸ باشد")
    .max(99, "سن نباید بیشتر از ۹۹ باشد"),
  profileImage: yup.mixed().notRequired(),
});

export const EditProfileForm = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { editUser, uploadImage } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: any) => {
    editUser.mutate(
      {
        fName: data.firstName,
        lName: data.lastName,
        email: data.email,
        age: data.age,
        phoneNumber: data.phone,
      },
      {
        onSuccess: (data) => {
          console.log("Uploaded:", data);
          toast.success(data?.message || "فرم با موفقیت ارسال شد ");
        },
        onError: (err) => {
          console.error("Upload failed:", err);
          toast.error("خطا در ارسال فرم ");
        },
      }
    );
    uploadImage.mutate(data.profileImage, {
      onSuccess: (data) => {
        console.log("Uploaded:", data);
        toast.success(data?.message || "فرم با موفقیت ارسال شد ");
      },
      onError: (err) => {
        console.error("Upload failed:", err);
        toast.error("خطا در ارسال فرم ");
      },
    });
    console.log("DATA:", data);
  };

  const handleImage = (file: File) => {
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setValue("profileImage", file);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-5">
      <ProfileImageUploader image={imagePreview} onChange={handleImage} />
      <TextField
        placeholder="نام را وارد کنید"
        {...register("firstName")}
        error={errors.firstName?.message}
      />

      <TextField
        placeholder="نام خانوادگی را وارد کنید"
        {...register("lastName")}
        error={errors.lastName?.message}
      />
      <TextField
        placeholder=" ایمیل را وارد کنید "
        {...register("email")}
        error={errors.email?.message}
      />
      <TextField
        placeholder="شماره همراه را وارد کنید "
        {...register("phone")}
        error={errors.phone?.message}
      />
      <TextField
        placeholder=" سن خود را وارد کنید "
        {...register("age")}
        error={errors.age?.message}
      />
      <Button type="submit" variant="success">
        ذخیره تغییرات
      </Button>
    </form>
  );
};
