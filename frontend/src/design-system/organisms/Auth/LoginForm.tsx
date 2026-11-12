"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useLoginUser from "@/hooks/mutations/useLoginUser";
import toast from "react-hot-toast";
import Button from "@/design-system/atoms/Button";
import { LogFormValues } from "./type";
import Cookies from "js-cookie";
import { redirectAfterAuth } from "@/shared/utils/authRedirect";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import PhoneOtpForm from "./PhoneOtpForm";
import { errorMessage } from "@/lib/actions/platform";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
const schema = yup
  .object({
    userName: yup.string().trim().matches(/^\S*$/, "نام کاربری نباید فاصله داشته باشد.").required("نام کاربری یا شماره همراه الزامی است"),
    password: yup
      .string()
      .trim()
      .matches(/^\S*$/, "رمز عبور نباید فاصله داشته باشد.")
      .min(6, "پسورد حداقل 6 کاراکتر باشد")
      .required("پسورد الزامی است"),
  })
  .required();

const LoginForm = () => {
  const [method, setMethod] = useState<"password" | "phone">("phone");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { loginuser } = useLoginUser();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogFormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (valuse: LogFormValues) => {

    const data = {
      userName: valuse?.userName,
      password: valuse?.password,
    };
    loginuser.mutate(data, {
      onSuccess: (date) => {
        if (!date?.data?.token || !date.data.refreshToken) {
          toast.error(date?.message || "ورود انجام نشد.");
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
        }
        toast.success(date?.message || "فرم با موفقیت ارسال شد ");
        redirectAfterAuth();
      },
      onError: (err) => {
        toast.error(errorMessage(err));
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="روش ورود">
        <button type="button" role="tab" aria-selected={method === "password"} onClick={() => setMethod("password")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${method === "password" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>ورود با رمز</button>
        <button type="button" role="tab" aria-selected={method === "phone"} onClick={() => setMethod("phone")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${method === "phone" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>شماره موبایل</button>
      </div>
      {method === "phone" ? <PhoneOtpForm purpose="Login" /> : (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="login-username" className="text-sm font-medium text-gray-700">نام کاربری یا شماره همراه</label>
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white pr-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
          <UserRound className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
          <input
            id="login-username"
            autoComplete="username"
            className="min-w-0 flex-1 rounded-l-lg bg-transparent p-2.5 text-gray-900 outline-none"
            {...register("userName")}
          />
        </div>
        {errors.userName?.message && <span className="text-xs text-red-500">{errors.userName.message}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="login-password" className="text-sm font-medium text-gray-700">رمز عبور</label>
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white pr-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
          <LockKeyhole className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
          <input
            id="login-password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            className="min-w-0 flex-1 rounded-l-lg bg-transparent p-2.5 text-gray-900 outline-none"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label={isPasswordVisible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          >
            {isPasswordVisible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        {errors.password?.message && <span className="text-xs text-red-500">{errors.password.message}</span>}
      </div>

      <Button variant="success">ورود </Button>
    </form>
      )}
    </div>
  );
};

export default LoginForm;
