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
  const { loginuser } = useLoginUser();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogFormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (valuse: LogFormValues) => {
    console.log(valuse);
    const data = {
      userName: valuse?.userName,
      password: valuse?.password,
    };
    loginuser.mutate(data, {
      onSuccess: (date) => {
        console.log(data);
        if (date?.data?.token && date?.data?.refreshToken) {
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
        }
        toast.success(date?.message || "فرم با موفقیت ارسال شد ");
        router.push("/");
      },
      onError: (err) => {
        console.log(err);
        console.log(err);
        toast.error("خطا در ارسال فرم ");
      },
    });
  };

  return (
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
  );
};

export default LoginForm;
