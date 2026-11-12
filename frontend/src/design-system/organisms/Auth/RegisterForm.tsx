"use client";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useRegisterUser from "@/hooks/mutations/useRegisterUser";
import toast from "react-hot-toast";
import { RegFormValues } from "./type";
import Cookies from "js-cookie";
import { redirectAfterAuth } from "@/shared/utils/authRedirect";
import { TextField } from "@/design-system/molecules/public";
import Button from "@/design-system/atoms/Button";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import PhoneOtpForm from "./PhoneOtpForm";
import { errorMessage } from "@/lib/actions/platform";
const schema = yup
  .object({
    firstName: yup.string().trim().required("نام الزامی است"),
    lastName: yup.string().trim().required("نام خانوادگی الزامی است"),
    userName: yup.string().trim().matches(/^\S*$/, "نام کاربری نباید فاصله داشته باشد.").min(5, "نام کاربری حداقل ۵ کاراکتر باشد").max(50, "نام کاربری حداکثر ۵۰ کاراکتر باشد").required("نام کاربری الزامی است"),
    password: yup
      .string()
      .trim()
      .matches(/^\S*$/, "رمز عبور نباید فاصله داشته باشد.")
      .min(6, "رمز عبور حداقل 6 کاراکتر باشد")
      .max(100, "رمز عبور حداکثر ۱۰۰ کاراکتر باشد")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, "رمز باید شامل حروف انگلیسی بزرگ و کوچک، عدد و یکی از نمادهای @$!%*?& باشد")
      .required("رمز عبور الزامی است"),
    confirmPassword: yup
      .string()
      .trim()
      .matches(/^\S*$/, "تکرار رمز عبور نباید فاصله داشته باشد.")
      .required("تکرار رمز عبور الزامی است")
      .test("same-password", "تکرار رمز عبور باید با رمز عبور یکسان باشد",
        (value, { parent }) => /\s/.test(parent.password ?? "") || value === parent.password),
  })
  .required();

const RegisterForm = () => {
  const [method, setMethod] = useState<"password" | "phone">("phone");
  const { registeruser } = useRegisterUser();
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
        if (!date.isSuccess || !date.data?.token || !date.data?.refreshToken) {
          toast.error(date.message || "ثبت‌نام کامل نشد؛ دوباره تلاش کنید");
          return;
        }
        if (date?.data?.token && date?.data?.refreshToken) {
          queryClient.clear();
          Cookies.remove("guestToken");
          Cookies.set("token", date.data.token, {
            expires: 7,
            secure: window.location.protocol === "https:",
            sameSite: "lax",
          });
          Cookies.set("refreshToken", date.data.refreshToken, {
            expires: 30,
            secure: window.location.protocol === "https:",
            sameSite: "lax",
          });
          toast.success(date?.message || "فرم با موفقیت ارسال شد ");
          redirectAfterAuth();
        }
      },
      onError: (err) => {
        toast.error(errorMessage(err));
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="روش ثبت‌نام">
        <button type="button" role="tab" aria-selected={method === "password"} onClick={() => setMethod("password")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${method === "password" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600"}`}>نام کاربری و رمز</button>
        <button type="button" role="tab" aria-selected={method === "phone"} onClick={() => setMethod("phone")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${method === "phone" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600"}`}>شماره موبایل</button>
      </div>
      {method === "phone" ? <PhoneOtpForm purpose="Register" /> : (
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
        autoComplete="username"
        autoCapitalize="none"
        {...register("userName")}
        error={errors.userName?.message}
      />
      <TextField
        label="رمز عبور"
        type="password"
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />
      <TextField
        label="تکرار رمز عبور"
        type="password"
        autoComplete="new-password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      <Button type="submit" variant="success" disabled={registeruser.isPending}>{registeruser.isPending ? "در حال ثبت‌نام…" : "ثبت‌نام"}</Button>
    </form>
      )}
    </div>
  );
};
export default RegisterForm;
