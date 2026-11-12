import React, { useState } from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMessage, request } from "../../api/platform";
import { saleDigits } from "../../shared/utils/sale-units";
import { theme } from "../../shared/theme";
import { Button } from "../atoms/Button";
import { Field } from "../atoms/Field";
import { Text } from "../atoms/Text";

export function ProfileContactField({ kind, savedValue, confirmed, value, onChange, editable = true, saving }: {
  kind: "email" | "phone";
  savedValue: string;
  confirmed: boolean;
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  saving: boolean;
}) {
  const client = useQueryClient();
  const [challenge, setChallenge] = useState<{ challengeCode?: string; testCode?: string }>();
  const [code, setCode] = useState("");
  const phone = kind === "phone";
  const label = phone ? "شماره همراه" : "ایمیل";
  const isSaved = !!savedValue && value.trim() === savedValue;
  const send = useMutation({
    mutationFn: async () => phone
      ? request<{ challengeCode: string; testCode?: string }>("/Auth/RequestPhoneCode", {
          method: "POST", data: { phoneNumber: savedValue, purpose: "ProfileVerification" },
        })
      : request("/Auth/SendVerificationCodeEmail", { method: "POST" }).then(() => ({})),
    onSuccess: (result) => {
      setChallenge(result);
      setCode("");
    },
  });
  const verify = useMutation({
    mutationFn: () => request(phone ? "/Auth/VerifyProfilePhone" : "/Auth/VerifyEmail", {
      method: "PATCH", data: phone ? { code, challengeCode: challenge?.challengeCode } : { code },
    }),
    onSuccess: async () => {
      setChallenge(undefined);
      setCode("");
      await client.invalidateQueries({ queryKey: ["profile"] });
    },
  });
  const busy = saving || send.isPending || verify.isPending;
  const verified = isSaved && (confirmed || verify.isSuccess);
  const canSend = isSaved && !verified;
  const failure = send.error || verify.error;
  const action = verified ? (
    <View accessible accessibilityLabel={`${label} تأیید شده`} style={{ width: 40, alignItems: "center" }}>
      <Ionicons name="checkmark-circle" size={23} color={theme.green} />
    </View>
  ) : canSend ? (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }}
      accessibilityLabel={`${challenge ? "ارسال دوباره کد" : "ارسال کد تأیید"} ${label}`}
      disabled={busy} onPress={() => { verify.reset(); send.mutate(); }}
      style={{ minHeight: 44, width: 87, justifyContent: "center", alignItems: "center", borderRadius: 10,
        backgroundColor: theme.mint, opacity: busy ? 0.65 : 1 }}>
      <Text bold style={{ color: theme.green, fontSize: 11 }}>
        {send.isPending ? "در حال ارسال…" : challenge ? "ارسال دوباره" : "ارسال کد"}
      </Text>
    </Pressable>
  ) : undefined;

  return (
    <View>
      <Field label={label} value={value} onChangeText={onChange} editable={editable && !busy}
        keyboardType={phone ? "phone-pad" : "email-address"} autoCapitalize="none" autoCorrect={false}
        autoComplete={phone ? "tel" : "email"} trailingAction={action}
        style={{ paddingRight: canSend ? 96 : verified ? 46 : 12, textAlign: "left", writingDirection: "ltr" }} />
      {!isSaved && !!value.trim() && <Text muted style={{ fontSize: 12 }}>برای دریافت کد، ابتدا تغییرات را ذخیره کنید.</Text>}
      {canSend && challenge && (
        <View style={{ marginBottom: 12 }}>
          <Field label={`کد تأیید ${label}`} value={code} onChangeText={(value) => setCode(saleDigits(value).replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} />
          <Button title="تأیید کد" busy={verify.isPending} disabled={busy || code.length !== 6} onPress={() => verify.mutate()}
            style={{ alignSelf: "flex-end" }} />
          {!!challenge.testCode && <Text muted style={{ fontSize: 12 }}>کد آزمایشی {challenge.testCode}</Text>}
        </View>
      )}
      {canSend && !!failure && <Text accessibilityRole="alert" style={{ color: theme.danger }}>{errorMessage(failure)}</Text>}
    </View>
  );
}
