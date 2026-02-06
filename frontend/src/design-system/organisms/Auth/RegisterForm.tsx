"use client";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useRegisterUser from "@/hooks/mutations/useRegisterUser";
import toast from "react-hot-toast";
import { RegFormValues } from "./type";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { TextField } from "@/design-system/molecules/public";
import Button from "@/design-system/atoms/Button";
import { useQueryClient } from "@tanstack/react-query";
const schema = yup
  .object({
    firstName: yup.string().required("نام الزامی است"),
    lastName: yup.string().required("نام خانوادگی الزامی است"),
    userName: yup.string().required("نام کاربری  الزامی است"),
    password: yup
      .string()
      .min(6, "رمز عبور حداقل 6 کاراکتر باشد")
      .required("رمز عبور الزامی است"),
    confirmPassword: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        "تکرار رمز عبور باید با رمز عبور یکسان باشد",
      )
      .required("تکرار رمز عبور الزامی است"),
  })
  .required();

const RegisterForm = () => {
  const { registeruser } = useRegisterUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegFormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (valuse: RegFormValues) => {
    const data = {
      userName: valuse?.userName,
      password: valuse?.password,
      fName: valuse?.firstName,
      lName: valuse?.lastName,
    };
    registeruser.mutate(data, {
      onSuccess: (date) => {
        if (date?.data?.token && date?.data?.refreshToken) {
          queryClient.invalidateQueries({
            queryKey: ["userProfile"],
          });
          Cookies.remove("guestToken");
          Cookies.set("token", date.data.token, {
            expires: 7,
            secure: true,
            sameSite: "strict",
          });
          Cookies.set("refreshToken", date.data.refreshToken, {
            expires: 30,
            secure: true,
            sameSite: "strict",
          });
          toast.success(date?.message || "فرم با موفقیت ارسال شد ");
          router.push("/");
        }
      },
      onError: (err) => {
        console.log(err);
        toast.error("خطا در ارسال فرم ");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <TextField
        label="نام"
        {...register("firstName")}
        error={errors.firstName?.message}
      />
      <TextField
        label="نام خانوادگی"
        {...register("lastName")}
        error={errors.lastName?.message}
      />
      <TextField
        label="نام کاربری"
        {...register("userName")}
        error={errors.userName?.message}
      />
      <TextField
        label="رمز عبور"
        type="password"
        {...register("password")}
        error={errors.password?.message}
      />
      <TextField
        label="تکرار رمز عبور"
        type="password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      <Button variant="success">ثبت‌نام</Button>
    </form>
  );
};
export default RegisterForm;
