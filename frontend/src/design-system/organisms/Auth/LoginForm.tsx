"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import useLoginUser from "@/hooks/mutations/useLoginUser";
import toast from "react-hot-toast";
import { TextField } from "@/design-system/molecules/public";
import Button from "@/design-system/atoms/Button";
import { LogFormValues } from "./type";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import PhoneOtpForm from "./PhoneOtpForm";
const schema = yup
  .object({
    userName: yup.string().required("نام کاربری الزامی است"),
    password: yup
      .string()
      .min(6, "پسورد حداقل 6 کاراکتر باشد")
      .required("پسورد الزامی است"),
  })
  .required();

const LoginForm = () => {
  const [method, setMethod] = useState<"password" | "phone">("password");
  const { loginuser } = useLoginUser();
  const router = useRouter();
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
        queryClient.invalidateQueries();
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next && /^\/dashboard(?:\/|$)/.test(next) && !next.includes("\\") ? next : "/dashboard");
        router.refresh();
      },
      onError: (err) => {

        toast.error("خطا در ارسال فرم ");
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="روش ورود">
        <button type="button" role="tab" aria-selected={method === "password"} onClick={() => setMethod("password")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${method === "password" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600"}`}>نام کاربری و رمز</button>
        <button type="button" role="tab" aria-selected={method === "phone"} onClick={() => setMethod("phone")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${method === "phone" ? "bg-white text-emerald-800 shadow-sm" : "text-gray-600"}`}>شماره موبایل</button>
      </div>
      {method === "phone" ? <PhoneOtpForm purpose="Login" /> : (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 ">
      <TextField
        label="نام کاربری"
        {...register("userName")}
        error={errors.userName?.message}
      />
      <TextField
        label="رمز عبور "
        type="password"
        {...register("password")}
        error={errors.password?.message}
      />

      <Button variant="success">ورود </Button>
    </form>
      )}
    </div>
  );
};

export default LoginForm;
