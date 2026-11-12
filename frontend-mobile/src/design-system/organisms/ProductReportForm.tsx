import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { request, errorMessage } from "../../api/platform";
import { appAlert } from "../../shared/alerts";
import { theme } from "../../shared/theme";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Field } from "../atoms/Field";

export function ProductReportForm({ code, signedIn, onLogin }: {
  code: string;
  signedIn: boolean;
  onLogin: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const report = useMutation({
    mutationFn: () => request<{ alreadyPending: boolean }>(`/ProductReport/${encodeURIComponent(code)}`, {
      method: "POST",
      data: { reason: reason.trim() },
    }),
    onSuccess: ({ alreadyPending }) => {
      setReason("");
      setOpen(false);
      appAlert.alert("گزارش آگهی", alreadyPending ? "گزارش قبلی شما در انتظار بررسی است." : "گزارش برای بررسی ثبت شد.", undefined, { tone: "success" });
    },
    onError: (error) => appAlert.alert("ارسال گزارش انجام نشد", errorMessage(error), undefined, { tone: "error" }),
  });

  if (!open || !signedIn) return (
    <Button
      outline
      compact
      title="گزارش آگهی"
      icon={<Ionicons name="flag-outline" size={17} color={theme.danger} />}
      style={{ minHeight: 44 }}
      onPress={() => signedIn ? setOpen(true) : onLogin()}
    />
  );
  return (
    <Card style={{ width: "100%" }}>
      <Field
        label="دلیل گزارش آگهی"
        placeholder="مثلاً تصویر یا توضیحات گمراه‌کننده است."
        multiline
        maxLength={1000}
        editable={!report.isPending}
        value={reason}
        onChangeText={setReason}
      />
      <Button title="ارسال گزارش" busy={report.isPending} disabled={reason.trim().length < 5} onPress={() => report.mutate()} />
      <Button outline title="انصراف" disabled={report.isPending} onPress={() => setOpen(false)} />
    </Card>
  );
}
