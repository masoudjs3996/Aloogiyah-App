"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { TextField } from "@/design-system/molecules/public";
import { errorMessage, request } from "@/lib/actions/platform";
import { saleDigits } from "@/shared/utils/sale-units";

export function ProfileContactField({ kind, savedValue, confirmed, value, onChange, onBlur, error, readOnly, saving }: {
  kind: "email" | "phone";
  savedValue: string;
  confirmed: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  readOnly?: boolean;
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
      toast.success("کد تأیید ارسال شد.");
    },
  });
  const verify = useMutation({
    mutationFn: () => request(phone ? "/Auth/VerifyProfilePhone" : "/Auth/VerifyEmail", {
      method: "PATCH", data: phone ? { code, challengeCode: challenge?.challengeCode } : { code },
    }),
    onSuccess: async () => {
      setChallenge(undefined);
      setCode("");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["platform", "profile"] }),
        client.invalidateQueries({ queryKey: ["userProfile"] }),
      ]);
      toast.success(`${label} تأیید شد.`);
    },
  });
  const busy = saving || send.isPending || verify.isPending;
  const verified = isSaved && (confirmed || verify.isSuccess);
  const canSend = isSaved && !verified;
  const failure = send.error || verify.error;
  const action = verified ? (
    <span role="status" aria-label={`${label} تأیید شده`} title={`${label} تأیید شده`} className="inline-flex p-2 text-emerald-700">
      <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
    </span>
  ) : canSend ? (
    <button type="button" disabled={busy} aria-label={`${challenge ? "ارسال دوباره کد" : "ارسال کد تأیید"} ${label}`}
      onClick={() => { verify.reset(); send.mutate(); }}
      className="min-h-9 whitespace-nowrap rounded-lg bg-emerald-50 px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">
      {send.isPending ? "در حال ارسال…" : challenge ? "ارسال دوباره" : "ارسال کد"}
    </button>
  ) : undefined;

  return (
    <div className="min-w-0 space-y-2">
      <TextField label={label} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur}
        error={error} readOnly={readOnly} dir="ltr" type={phone ? "tel" : "email"} autoComplete={phone ? "tel" : "email"}
        trailingAction={action} className={verified ? "pl-11" : canSend ? "pl-24" : undefined} />
      {!isSaved && value.trim() && <p className="text-xs text-slate-500">برای دریافت کد، ابتدا تغییرات را ذخیره کنید.</p>}
      {canSend && challenge && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-28 flex-1">
            <TextField label={`کد تأیید ${label}`} value={code} onChange={(event) => setCode(saleDigits(event.target.value).replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr"
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (!busy && code.length === 6) verify.mutate(); } }} />
          </div>
          <button type="button" disabled={busy || code.length !== 6} onClick={() => verify.mutate()}
            className="min-h-11 rounded-xl bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-50">
            تأیید کد
          </button>
          {challenge.testCode && <p className="w-full text-xs text-slate-500">کد آزمایشی {challenge.testCode}</p>}
        </div>
      )}
      {canSend && failure && <p role="alert" className="text-xs text-red-700">{errorMessage(failure)}</p>}
    </div>
  );
}
