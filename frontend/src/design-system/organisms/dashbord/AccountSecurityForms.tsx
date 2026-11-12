"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { request, errorMessage } from "@/lib/actions/platform";
import { logout } from "@/lib/store/slices/userSlice";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import { TextField } from "@/design-system/molecules/platform/FormField";
import { saleDigits } from "@/shared/utils/sale-units";

const panelClass =
  "space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";

function FormError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm leading-7 text-red-700">
      {message}
    </p>
  ) : null;
}

export default function AccountSecurityForms({ phoneOnly, phoneNumber }: {
  phoneOnly: boolean;
  phoneNumber: string;
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const client = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernamePassword, setUsernamePassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [challenge, setChallenge] = useState<{ challengeCode: string; testCode?: string }>();

  const signInAgain = async () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    Cookies.remove("guestToken");
    dispatch(logout());
    await client.cancelQueries();
    client.clear();
    router.replace("/Login?next=%2Fdashboard%2Fprofile");
    router.refresh();
  };
  const setupChallenge = useMutation({
    mutationFn: () => request<{ challengeCode: string; testCode?: string }>("/Auth/RequestPhoneCode", {
      method: "POST", data: { phoneNumber, purpose: "PasswordSetup" },
    }),
    onSuccess: result => { setChallenge(result); setSetupCode(""); toast.success("کد تأیید ارسال شد."); },
  });
  const activatePassword = useMutation({
    mutationFn: (challengeCode: string) => request("/Auth/SetPhoneCredentials", {
      method: "POST", data: { challengeCode, code: saleDigits(setupCode), username: setupUsername.trim(), password: setupPassword },
    }),
    onSuccess: async () => {
      toast.success("ورود با رمز فعال شد. دوباره وارد حساب شوید.");
      await signInAgain();
    },
  });

  const password = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      request("/Auth/ChangePassword", { method: "PATCH", data }),
    onSuccess: async () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("رمز عبور تغییر کرد. با رمز جدید دوباره وارد شوید.");
      await signInAgain();
    },
  });
  const username = useMutation({
    mutationFn: (data: {
      currentUsername: string;
      newUsername: string;
      password: string;
    }) => request("/Auth/ChangeUsername", { method: "PATCH", data }),
    onSuccess: async () => {
      setCurrentUsername(newUsername.trim());
      setNewUsername("");
      setUsernamePassword("");
      toast.success("نام کاربری تغییر کرد.");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["platform", "profile"] }),
        client.invalidateQueries({ queryKey: ["userProfile"] }),
      ]);
    },
  });
  const busy =
    password.isPending ||
    username.isPending || setupChallenge.isPending || activatePassword.isPending;

  const changePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    password.reset();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }
    password.mutate({ currentPassword, newPassword });
  };
  const changeUsername = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    username.reset();
    setUsernameError("");
    if (currentUsername.trim() === newUsername.trim()) {
      setUsernameError("نام کاربری جدید باید با نام کاربری فعلی متفاوت باشد.");
      return;
    }
    username.mutate({
      currentUsername: currentUsername.trim(),
      newUsername: newUsername.trim(),
      password: usernamePassword,
    });
  };

  return (
    <div className="space-y-6" aria-label="امنیت حساب">
      {phoneOnly ? (
        <section className={panelClass} aria-labelledby="phone-security-heading">
          <h2 id="phone-security-heading" className="text-lg font-bold text-slate-900">امنیت ورود</h2>
          <p className="text-sm leading-7 text-slate-600">روش ورود شما شمارهٔ موبایل و کد پیامکی است. در صورت تمایل می‌توانید ورود با نام کاربری و رمز را روی همین حساب فعال کنید.</p>
          <ActionButton variant="secondary" disabled={busy || !phoneNumber} busy={setupChallenge.isPending} onClick={() => setupChallenge.mutate()}>
            {challenge ? "ارسال دوبارهٔ کد" : "فعال‌کردن ورود با رمز"}
          </ActionButton>
          <FormError message={setupChallenge.error ? errorMessage(setupChallenge.error) : undefined} />
          {challenge && (
            <form className="space-y-4" onSubmit={event => {
              event.preventDefault();
              if (!busy) activatePassword.mutate(challenge.challengeCode);
            }}>
              {challenge.testCode && <p className="text-xs text-slate-600">کد آزمایشی {challenge.testCode}</p>}
              <TextField label="کد پیامکی" required inputMode="numeric" maxLength={6} value={setupCode} onChange={e => setSetupCode(e.target.value)} />
              <TextField label="نام کاربری دلخواه" required minLength={5} maxLength={50} value={setupUsername} onChange={e => setSetupUsername(e.target.value)} />
              <TextField label="رمز دلخواه" required type="password" autoComplete="new-password" minLength={8} maxLength={72} value={setupPassword} onChange={e => setSetupPassword(e.target.value)} />
              <FormError message={activatePassword.error ? errorMessage(activatePassword.error) : undefined} />
              <ActionButton type="submit" disabled={busy} busy={activatePassword.isPending}>تأیید و فعال‌سازی</ActionButton>
            </form>
          )}
        </section>
      ) : <section className={panelClass} aria-labelledby="password-heading">
        <div>
          <h2
            id="password-heading"
            className="text-lg font-bold text-slate-900"
          >
            تغییر رمز عبور
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            پس از تغییر رمز عبور، لازم است دوباره وارد حساب شوید.
          </p>
        </div>
        <form onSubmit={changePassword}>
          <fieldset disabled={busy} className="space-y-4">
            <TextField
              label="رمز فعلی"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <TextField
              label="رمز جدید"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]+"
              hint="حداقل ۸ کاراکتر، شامل حرف بزرگ و کوچک انگلیسی، عدد و یکی از نشانه‌های @$!%*?&"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <TextField
              label="تکرار رمز جدید"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <FormError
              message={
                passwordError ||
                (password.error ? errorMessage(password.error) : undefined)
              }
            />
            <ActionButton type="submit" busy={password.isPending}>
              تغییر رمز
            </ActionButton>
          </fieldset>
        </form>
      </section>}
      {!phoneOnly && <section className={panelClass} aria-labelledby="username-heading">
        <h2 id="username-heading" className="text-lg font-bold text-slate-900">
          تغییر نام کاربری
        </h2>
        <form onSubmit={changeUsername}>
          <fieldset disabled={busy} className="space-y-4">
            <TextField
              label="نام کاربری فعلی"
              autoComplete="username"
              autoCapitalize="none"
              required
              value={currentUsername}
              onChange={(event) => setCurrentUsername(event.target.value)}
            />
            <TextField
              label="نام کاربری جدید"
              autoComplete="off"
              autoCapitalize="none"
              required
              minLength={5}
              maxLength={50}
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
            />
            <TextField
              label="رمز عبور برای تغییر نام کاربری"
              type="password"
              autoComplete="current-password"
              required
              value={usernamePassword}
              onChange={(event) => setUsernamePassword(event.target.value)}
            />
            <FormError
              message={
                usernameError ||
                (username.error ? errorMessage(username.error) : undefined)
              }
            />
            <ActionButton type="submit" busy={username.isPending}>
              تغییر نام کاربری
            </ActionButton>
          </fieldset>
        </form>
      </section>}
    </div>
  );
}
