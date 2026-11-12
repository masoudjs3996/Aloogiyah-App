import { BrandLogo } from "../design-system/atoms/BrandLogo";
import { appAlert as Alert } from "../shared/alerts";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { theme } from "../shared/theme";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { Card } from "../design-system/atoms/Card";
import { request } from "../api/platform";
import { api } from "../api/mobile";
import { useAction } from "../shared/hooks/useAction";
import { useAuth } from "../shared/providers/AuthProvider";
import { digits } from "../shared/utils/format";
import type { Props } from "../navigation/types";
type AuthMethod = "phone" | "password";

function cleanCredential(value: string, label: string) {
  const trimmed = value.trim();
  if (/\s/u.test(trimmed)) throw new Error(`${label} نباید فاصله داشته باشد.`);
  return trimmed;
}

function MethodTabs({
  value,
  onChange,
  disabled,
}: {
  value: AuthMethod;
  onChange: (value: AuthMethod) => void;
  disabled: boolean;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row-reverse",
        backgroundColor: theme.bg,
        borderRadius: 14,
        padding: 4,
        gap: 4,
        marginVertical: 8,
      }}
    >
      {(
        [
          { value: "phone", label: "شماره موبایل" },
          { value: "password", label: "نام کاربری" },
        ] as const
      ).map((item) => (
        <Pressable
          key={item.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === item.value, disabled }}
          disabled={disabled}
          onPress={() => onChange(item.value)}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 11,
            backgroundColor: value === item.value ? theme.white : "transparent",
            borderWidth: 1,
            borderColor: value === item.value ? theme.border : "transparent",
            opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
            paddingHorizontal: 6,
          })}
        >
          <Text
            bold
            style={{
              color: value === item.value ? theme.green : theme.muted,
              textAlign: "center",
            }}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function LoginScreen({ navigation }: Props<"Login">) {
  const [method, setMethod] = useState<"phone" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<{ challenge: string; phone: string; deadline: number }>();
  const [code, setCode] = useState("");
  const [now, setNow] = useState(0);
  const challenge = method === "phone" && otp?.phone === digits(phone) ? otp : undefined;
  const deadline = challenge?.deadline;
  const seconds = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;
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
  const { busy, run } = useAction();
  const auth = useAuth();
  const requestCode = () =>
    run(async () => {
      const number = digits(phone);
      if (challenge && Date.now() < challenge.deadline) return;
      if (!/^09\d{9}$/.test(number))
        throw new Error("شماره همراه معتبر وارد کنید");
      const response = await api.phone({ phoneNumber: number, purpose: "Login" });
      const receivedAt = Date.now();
      const duration = Math.min(180, response.expiresInSeconds ?? 180);
      setNow(receivedAt);
      setOtp({
        challenge: response.challengeCode,
        phone: number,
        deadline: receivedAt + duration * 1000,
      });
      setCode(response.testCode || "");
      if (response.testCode) Alert.alert("کد محیط آزمایشی", response.testCode);
    });
  const submit = () =>
    run(async () => {
      if (method === "password") {
        const userName = cleanCredential(phone, "نام کاربری");
        const cleanPassword = cleanCredential(password, "رمز عبور");
        if (!userName || !cleanPassword)
          throw new Error("نام کاربری یا شماره همراه و رمز را وارد کنید");
        await auth.login(await api.login(userName, cleanPassword));
        navigation.goBack();
      } else if (challenge) {
        if (Date.now() >= challenge.deadline) throw new Error("مهلت کد تمام شد. کد تازه بگیرید.");
        if (!/^\d{6}$/.test(digits(code))) throw new Error("کد شش‌رقمی را وارد کنید.");
        await auth.login(await api.verify(challenge.challenge, digits(code)));
        navigation.goBack();
      }
    });
  return (
    <Screen>
      <BrandLogo />
      <Text muted style={{ marginBottom: 20 }}>
        از مزرعه تا مغازه، همراه هم
      </Text>
      <Card>
        <Text bold style={{ fontSize: 20 }}>
          ورود به حساب
        </Text>
        <Text muted>به آلوگیاه خوش آمدید؛ روش ورود خود را انتخاب کنید.</Text>
        <MethodTabs
          value={method}
          disabled={busy}
          onChange={(next) => {
            if (next === method) return;
            setMethod(next);
            setCode("");
            setPhone("");
            setPassword("");
          }}
        />
        <Field
          label={method === "phone" ? "شماره همراه" : "نام کاربری یا شماره همراه"}
          value={phone}
          editable={!busy}
          onChangeText={(value) => {
            if (method === "phone") {
              setPhone(digits(value).replace(/\D/g, "").slice(0, 11));
              setCode("");
              setNow(Date.now());
            } else setPhone(value);
          }}
          keyboardType={method === "phone" ? "phone-pad" : "default"}
          autoCapitalize="none"
        />
        {method === "password" ? (
          <>
            <Field
              label="رمز عبور"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button busy={busy} title="ورود" onPress={submit} />
          </>
        ) : (
          <>
            <Button
              title={challenge ? seconds > 0 ? `ارسال دوباره کد (${countdown})` : "ارسال دوباره کد" : "دریافت کد یک‌بارمصرف"}
              disabled={busy || seconds > 0}
              onPress={requestCode}
            />
            {challenge && (
              <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: theme.bg }}>
                <Field
                  label="کد تأیید"
                  value={code}
                  editable={!busy && seconds > 0}
                  onChangeText={(value) => setCode(digits(value).replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  placeholder="کد ۶ رقمی"
                  style={{ textAlign: "center" }}
                />
                <Button busy={busy && seconds > 0} disabled={busy || seconds === 0} title="ورود" onPress={submit} />
              </View>
            )}
          </>
        )}
      </Card>
      <View
        style={{
          flexDirection: "row-reverse",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="link"
          onPress={() => navigation.navigate("Register")}
          style={{
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: 8,
          }}
        >
          <Text bold style={{ color: theme.green }}>
            حساب ندارید؟ ثبت‌نام
          </Text>
        </Pressable>
        {method === "password" && (
          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate("Recovery")}
            style={{
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: 8,
            }}
          >
            <Text muted>فراموشی رمز عبور</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
export function RegisterScreen({ navigation }: Props<"Register">) {
  const [method, setMethod] = useState<"phone" | "password">("phone");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fName, setFirst] = useState("");
  const [lName, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");
  const { busy, run } = useAction();
  const auth = useAuth();
  return (
    <Screen title="ساخت حساب">
      <BrandLogo />
      <Card>
        <Text bold style={{ fontSize: 20 }}>
          به جمع آلوگیاه بپیوندید
        </Text>
        <Text muted>روش ثبت‌نام را انتخاب و مشخصات خود را وارد کنید.</Text>
        <MethodTabs
          value={method}
          disabled={busy}
          onChange={(next) => {
            if (next === method) return;
            setMethod(next);
            setChallenge("");
            setCode("");
            setPhone("");
            setPassword("");
            setConfirmPassword("");
          }}
        />
        <Field label="نام" value={fName} onChangeText={setFirst} />
        <Field label="نام خانوادگی" value={lName} onChangeText={setLast} />
        <Field
          label={method === "phone" ? "شماره همراه" : "نام کاربری"}
          value={phone}
          onChangeText={setPhone}
          keyboardType={method === "phone" ? "phone-pad" : "default"}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {method === "password" && (
          <>
            <Field
              label="رمز عبور"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Text muted style={{ marginBottom: 12, fontSize: 12 }}>
              ۶ تا ۱۰۰ کاراکتر؛ حروف انگلیسی بزرگ و کوچک، عدد و یکی از نمادهای
              @$!%*?&
            </Text>
            <Field
              label="تکرار رمز عبور"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </>
        )}
        {challenge && (
          <Field
            label="کد پیامکی"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
          />
        )}
        <Button
          busy={busy}
          title={
            method === "password"
              ? "ساخت حساب"
              : challenge
                ? "تأیید و ساخت حساب"
                : "دریافت کد ثبت‌نام"
          }
          onPress={() =>
            run(async () => {
              if (method === "password") {
                const userName = cleanCredential(phone, "نام کاربری");
                const cleanPassword = cleanCredential(password, "رمز عبور");
                const cleanConfirmation = cleanCredential(confirmPassword, "تکرار رمز عبور");
                if (
                  !fName.trim() ||
                  !lName.trim() ||
                  !userName ||
                  cleanPassword.length < 6
                )
                  throw new Error(
                    "نام، نام خانوادگی، نام کاربری و رمز معتبر الزامی است",
                  );
                if (userName.length < 5 || userName.length > 50)
                  throw new Error("نام کاربری باید بین ۵ تا ۵۰ کاراکتر باشد");
                if (
                  cleanPassword.length > 100 ||
                  !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(
                    cleanPassword,
                  )
                )
                  throw new Error(
                    "رمز باید شامل حروف انگلیسی بزرگ و کوچک، عدد و یکی از نمادهای @$!%*?& باشد",
                  );
                if (cleanPassword !== cleanConfirmation)
                  throw new Error("تکرار رمز عبور باید با رمز عبور یکسان باشد");
                await auth.login(
                  await api.register({
                    userName,
                    password: cleanPassword,
                    fName: fName.trim(),
                    lName: lName.trim(),
                  }),
                );
                navigation.popToTop();
                return;
              }
              if (challenge) {
                await auth.login(await api.verify(challenge, digits(code)));
                navigation.popToTop();
              } else {
                if (
                  !fName.trim() ||
                  !lName.trim() ||
                  !/^09\d{9}$/.test(digits(phone))
                )
                  throw new Error("نام، نام خانوادگی و شماره صحیح الزامی است");
                const r = await api.phone({
                  phoneNumber: digits(phone),
                  purpose: "Register",
                  fName,
                  lName,
                });
                setChallenge(r.challengeCode);
                if (r.testCode) Alert.alert("کد محیط آزمایشی", r.testCode);
              }
            })
          }
        />
      </Card>
      <Pressable
        accessibilityRole="link"
        onPress={() => navigation.navigate("Login")}
        style={{
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text bold style={{ color: theme.green }}>
          قبلاً ثبت‌نام کرده‌اید؟ ورود به حساب
        </Text>
      </Pressable>
      <Button outline title="سیاست حریم خصوصی و پشتیبانی"
        onPress={() => void run(() => WebBrowser.openBrowserAsync("https://aloogiyah.ir/privacy"))} />
    </Screen>
  );
}

export function RecoveryScreen({ navigation }: Props<"Recovery">) {
  const [user, setUser] = useState("");
  const [reset, setReset] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const { busy, run } = useAction();
  return (
    <Screen>
      <BrandLogo />
      <Card>
        <Text bold style={{ fontSize: 22 }}>
          بازیابی رمز عبور
        </Text>
        {!sent ? (
          <>
            <Field label="ایمیل حساب" value={user} onChangeText={setUser} />
            <Button
              busy={busy}
              title="ارسال کد بازیابی"
              onPress={() =>
                run(async () => {
                  if (!user.trim()) throw new Error("ایمیل حساب را وارد کنید");
                  await request("/Auth/SendResetPasswordCode", {
                    method: "POST",
                    data: { code: user.trim() },
                  });
                  setSent(true);
                }, "کد بازیابی ارسال شد")
              }
            />
          </>
        ) : (
          <>
            <Field label="کد بازیابی" value={reset} onChangeText={setReset} />
            <Field
              label="رمز جدید"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Button
              busy={busy}
              title="ثبت رمز جدید"
              onPress={() =>
                run(async () => {
                  if (!reset.trim() || password.length < 6)
                    throw new Error("کد بازیابی و رمز معتبر وارد کنید");
                  await request("/Auth/resetPassword", {
                    method: "PATCH",
                    data: {
                      email: user.trim(),
                      resetCode: reset,
                      newPassword: password,
                    },
                  });
                  navigation.goBack();
                }, "رمز تغییر کرد")
              }
            />
          </>
        )}
      </Card>
    </Screen>
  );
}
