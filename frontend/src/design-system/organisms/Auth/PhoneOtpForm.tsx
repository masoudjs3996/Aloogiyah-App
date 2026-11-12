"use client";

import { FormEvent, useEffect, useState } from "react";
import { redirectAfterAuth } from "@/shared/utils/authRedirect";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Button from "@/design-system/atoms/Button";
import { RequestPhoneCode, VerifyPhoneCode } from "@/lib/actions/auth";
import { errorMessage } from "@/lib/actions/platform";

type Props = { purpose: "Login" | "Register" };

const toEnglishDigits = (value: string) => value
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const PhoneOtpForm = ({ purpose }: Props) => {
  const queryClient = useQueryClient();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  const [testCode, setTestCode] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loginCode, setLoginCode] = useState<{ phone: string; deadline: number }>();
  const [now, setNow] = useState(0);
  const isLogin = purpose === "Login";
  const activeChallenge = !isLogin || loginCode?.phone === phoneNumber ? challengeCode : "";
  const deadline = isLogin && activeChallenge ? loginCode?.deadline : undefined;
  const seconds = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
  const expired = isLogin && seconds === 0;
  const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
    .replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

  useEffect(() => {
    if (!deadline) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    if (isSending || isVerifying || (deadline && Date.now() < deadline)) return;
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
      if (isLogin) {
        const receivedAt = Date.now();
        const duration = Math.min(180, result.data.expiresInSeconds ?? 180);
        setNow(receivedAt);
        setLoginCode({
          phone: phoneNumber,
          deadline: receivedAt + duration * 1000,
        });
      }
      setChallengeCode(result.data.challengeCode);
      setTestCode(result.data.testCode || "");
      setCode(result.data.testCode || "");
      toast.success(result.data.testCode ? "کد آزمایشی آماده است." : "کد ارسال شد.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (isSending || isVerifying || (deadline && Date.now() >= deadline)) return;
    if (!activeChallenge || !/^\d{6}$/.test(code)) {
      toast.error("کد شش‌رقمی را وارد کنید.");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await VerifyPhoneCode({ challengeCode: activeChallenge, code });
      if (!result?.data?.token || !result.data.refreshToken) throw new Error(result.message || "کد معتبر نیست.");
      queryClient.clear();
      Cookies.remove("guestToken");
      Cookies.set("token", result.data.token, { expires: 7, secure: window.location.protocol === "https:", sameSite: "lax" });
      Cookies.set("refreshToken", result.data.refreshToken, { expires: 30, secure: window.location.protocol === "https:", sameSite: "lax" });
      toast.success(result.message || "ورود موفقیت‌آمیز بود.");
      redirectAfterAuth();
    } catch (error) {
      toast.error(errorMessage(error));
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
        <input type="tel" inputMode="numeric" autoComplete="tel" dir="ltr" value={phoneNumber} disabled={isSending || isVerifying} onChange={(event) => {
          setPhoneNumber(toEnglishDigits(event.target.value).replace(/\D/g, "").slice(0, 11));
          if (isLogin) {
            setNow(Date.now());
            setCode("");
          }
        }} placeholder="09123456789" className="rounded-lg border border-gray-300 px-3 py-2.5 text-left outline-none focus:border-emerald-600" />
        </label>
        <Button type="submit" variant="success" disabled={isSending || isVerifying || seconds > 0}>
          {isSending ? "در حال دریافت کد..." : activeChallenge ? seconds > 0 ? `ارسال دوباره کد (${countdown})` : "ارسال دوباره کد" : "دریافت کد یک‌بارمصرف"}
        </Button>
      </form>
      {activeChallenge && (
        <form onSubmit={verifyCode} className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          {testCode && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-emerald-900">
              کد آزمایشی (فعلاً پیامک ارسال نمی‌شود)
              <input readOnly value={testCode} dir="ltr" className="rounded-lg border border-emerald-200 bg-white px-3 py-2.5 text-center text-lg font-bold tracking-[0.3em]" />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            کد تأیید
            <input autoComplete="one-time-code" inputMode="numeric" dir="ltr" value={code} disabled={isSending || isVerifying || expired} onChange={(event) => setCode(toEnglishDigits(event.target.value).replace(/\D/g, "").slice(0, 6))} placeholder="کد ۶ رقمی" className="rounded-lg border border-gray-300 px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-emerald-600" />
          </label>
          <Button type="submit" variant="success" disabled={isSending || isVerifying || expired}>{isVerifying ? "در حال بررسی..." : purpose === "Register" ? "ثبت‌نام و ورود" : "ورود"}</Button>
        </form>
      )}
      {!isLogin && <p className="text-xs leading-6 text-gray-500">کد پس از ۵ دقیقه منقضی می‌شود و برای درخواست دوباره باید یک دقیقه صبر کنید.</p>}
    </div>
  );
};

export default PhoneOtpForm;
