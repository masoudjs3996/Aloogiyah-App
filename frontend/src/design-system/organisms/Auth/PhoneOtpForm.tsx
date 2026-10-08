"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Button from "@/design-system/atoms/Button";
import { RequestPhoneCode, VerifyPhoneCode } from "@/lib/actions/auth";

type Props = { purpose: "Login" | "Register" };

const toEnglishDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const PhoneOtpForm = ({ purpose }: Props) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  const [testCode, setTestCode] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^09\d{9}$/.test(phoneNumber)) {
      toast.error("شماره موبایل را به شکل ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.");
      return;
    }
    if (purpose === "Register" && (!firstName.trim() || !lastName.trim())) {
      toast.error("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    setIsSending(true);
    try {
      const result = await RequestPhoneCode({
        phoneNumber,
        purpose,
        ...(purpose === "Register" ? { fName: firstName.trim(), lName: lastName.trim() } : {}),
      });
      if (!result.isSuccess || !result.data?.challengeCode) throw new Error(result.message);
      setChallengeCode(result.data.challengeCode);
      setTestCode(result.data.testCode || "");
      setCode(result.data.testCode || "");
      toast.success(result.data.testCode ? "کد آزمایشی آماده است." : "کد ارسال شد.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "دریافت کد انجام نشد.");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!challengeCode || !/^\d{6}$/.test(code)) {
      toast.error("کد شش‌رقمی را وارد کنید.");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await VerifyPhoneCode({ challengeCode, code });
      if (!result?.data?.token || !result.data.refreshToken) throw new Error(result.message || "کد معتبر نیست.");
      queryClient.clear();
      Cookies.remove("guestToken");
      Cookies.set("token", result.data.token, { expires: 7, secure: window.location.protocol === "https:", sameSite: "lax" });
      Cookies.set("refreshToken", result.data.refreshToken, { expires: 30, secure: window.location.protocol === "https:", sameSite: "lax" });
      toast.success(result.message || "ورود موفقیت‌آمیز بود.");
      await queryClient.invalidateQueries();
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && /^\/dashboard(?:\/|$)/.test(next) && !next.includes("\\") ? next : "/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "تأیید کد انجام نشد.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {purpose === "Register" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            نام
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-emerald-600" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            نام خانوادگی
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-emerald-600" />
          </label>
        </div>
      )}
      <form onSubmit={requestCode} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          شماره موبایل
        <input type="tel" inputMode="numeric" autoComplete="tel" dir="ltr" value={phoneNumber} onChange={(event) => setPhoneNumber(toEnglishDigits(event.target.value).replace(/\D/g, "").slice(0, 11))} placeholder="09123456789" className="rounded-lg border border-gray-300 px-3 py-2.5 text-left outline-none focus:border-emerald-600" />
        </label>
        <Button type="submit" variant="success" disabled={isSending}>{isSending ? "در حال دریافت کد..." : challengeCode ? "ارسال دوباره کد" : "دریافت کد یک‌بارمصرف"}</Button>
      </form>
      {challengeCode && (
        <form onSubmit={verifyCode} className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          {testCode && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-emerald-900">
              کد آزمایشی (فعلاً پیامک ارسال نمی‌شود)
              <input readOnly value={testCode} dir="ltr" className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-center text-lg font-bold tracking-[0.3em]" />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            کد تأیید
            <input autoComplete="one-time-code" inputMode="numeric" dir="ltr" value={code} onChange={(event) => setCode(toEnglishDigits(event.target.value).replace(/\D/g, "").slice(0, 6))} placeholder="کد ۶ رقمی" className="rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-emerald-600" />
          </label>
          <Button type="submit" variant="success" disabled={isVerifying}>{isVerifying ? "در حال بررسی..." : purpose === "Register" ? "ثبت‌نام و ورود" : "ورود"}</Button>
        </form>
      )}
      <p className="text-xs leading-6 text-gray-500">کد پس از ۵ دقیقه منقضی می‌شود و برای درخواست دوباره باید یک دقیقه صبر کنید.</p>
    </div>
  );
};

export default PhoneOtpForm;
