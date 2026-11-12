import { iranIbanDigits, settlementRules } from "../../shared/utils/settlement-form";
import { useRef, useState } from "react";
import { normalizeMoney, formatMoneyInput } from "../../shared/utils/money-input";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { request } from "../../api/platform";
import { useAuth } from "../../shared/providers/AuthProvider";
import { useAction } from "../../shared/hooks/useAction";
import { money, date } from "../../shared/utils/format";
import { settlementStatuses, settlementActions, type Settlement, type SettlementPage, type SettlementSummary, type SellerIncome } from "../../shared/types/settlement";
import { Card } from "../atoms/Card";
import { Text } from "../atoms/Text";
import { Field } from "../atoms/Field";
import { Button } from "../atoms/Button";
import { QueryState } from "../molecules/QueryState";

export function SettlementsPanel() {
  const signedIn = useAuth().signedIn;
  const [expanded, setExpanded] = useState(false), [status, setStatus] = useState(""), [page, setPage] = useState(1);
  const [amount, setAmount] = useState(""), [iban, setIban] = useState(""), [holder, setHolder] = useState("");
  const [details, setDetails] = useState("");
  const key = useRef(""), signature = useRef(""); const { busy, run } = useAction();
  const summary = useQuery({ queryKey: ["settlements", "summary"], queryFn: () => request<SettlementSummary>("/Settlement/Summary"), enabled: signedIn && expanded });
  const q = useQuery({ queryKey: ["settlements", "requests", status, page], queryFn: () => request<SettlementPage<Settlement>>("/Settlement/Requests", { params: { status, page } }), enabled: signedIn && expanded });
  const income = useQuery({ queryKey: ["settlements", "income", page], queryFn: () => request<SettlementPage<SellerIncome>>("/Settlement/Income", { params: { page } }), enabled: signedIn && expanded });
  const paymentDate = (s: string) => date(s.length === 10 ? `${s}T12:00:00+03:30` : s);
  return <View style={{ gap: 12 }}>
    <Button title={expanded ? "بستن حساب مالی کشاورز" : "حساب کشاورز، درخواست تسویه و سوابق واریز"} onPress={() => setExpanded(v => !v)} />
    {expanded && <>
      <Card><Text bold>حساب مالی کشاورز</Text><Text>درآمد پس از ثبت کد تحویل خریدار آزاد می‌شود و می‌توانید درخواست واریز به حساب ثبت کنید.</Text></Card>
      <QueryState loading={summary.isLoading || q.isLoading} error={summary.error || q.error || income.error} retry={() => { void summary.refetch(); void q.refetch(); void income.refetch(); }} />
      {summary.data && <>
        <Card><Text bold>درآمد رزروشده: {money(summary.data.reserved)}</Text><Text bold>قابل درخواست: {money(summary.data.available)}</Text><Text>در انتظار تسویه: {money(summary.data.pending)}</Text><Text>پرداخت‌شده: {money(summary.data.paid)}</Text><Text>کارمزد: {summary.data.commissionRate}٪ · مالیات: {summary.data.taxRate}٪</Text></Card>
        <Card><Text bold>درخواست واریز به حساب</Text><Field label="مبلغ به تومان" keyboardType="decimal-pad" value={formatMoneyInput(amount)} onChangeText={value => { const raw = normalizeMoney(value); if (raw !== null) setAmount(raw); }} /><Field label="شماره شبا (۲۴ رقم)" prefix="IR" accessibilityLabel="۲۴ رقم شماره شبا؛ پیشوند IR خودکار است" keyboardType="number-pad" autoCorrect={false} value={iban} onChangeText={value => { const raw = iranIbanDigits(value); if (raw !== null) setIban(raw); }} maxLength={34} style={{ textAlign: "left", writingDirection: "ltr" }} /><Field label="نام صاحب حساب" value={holder} onChangeText={setHolder} maxLength={150} />
          <Text>حساب باید متعلق به کشاورز باشد؛ مدیریت پیش از تأیید، نام و شبا را تطبیق می‌دهد.</Text>
          <Button title="ثبت درخواست تسویه" busy={busy} disabled={summary.data.available <= 0} onPress={() => void run(async () => {
            const data = { amount: Number(amount), iban: "IR" + iban, accountHolder: holder };
            if (!Number.isFinite(data.amount) || data.amount <= 0 || data.amount > summary.data!.available) throw new Error("مبلغ مثبت و حداکثر برابر درآمد آزاد وارد کنید.");
            if (iban.length !== 24) throw new Error("۲۴ رقم شماره شبا را کامل وارد کنید.");
            const next = JSON.stringify(data);
            if (!key.current || signature.current !== next) { key.current = `settlement-${Date.now()}-${Math.random().toString(36).slice(2)}`; signature.current = next; }
            await request("/Settlement/Requests", { method: "POST", data: { ...data, idempotencyKey: key.current } });
            key.current = ""; setAmount("");
          }, "درخواست تسویه ثبت شد.")} />
        </Card>
        <Card><Text bold>قوانین تسویه حساب</Text>{settlementRules.map(rule => <Text key={rule}>• {rule}</Text>)}</Card>
      </>}
      <Text bold>درخواست‌ها و سوابق واریز</Text>
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>{[["", "همه"], ...Object.entries(settlementStatuses)].map(([v, title]) => <Button key={v} compact outline={status !== v} title={title} onPress={() => { setStatus(v); setPage(1); }} />)}</View>
      {q.data?.items.length === 0 && <Text muted>درخواستی در این بخش نیست.</Text>}
      {q.data?.items.map(r => <Card key={r.code}><Text bold>{money(r.amount)} · {settlementStatuses[r.status]}</Text><Text>کد: {r.code}</Text><Text>ثبت: {paymentDate(r.createdAt)} · موعد: {r.scheduledDate ? paymentDate(r.scheduledDate) : "در انتظار تعیین موعد"}</Text><Text>{r.accountHolder} · {r.iban}</Text>{r.paidAt && <Text>واریز: {paymentDate(r.paidAt)} · پیگیری: {r.transferReference}</Text>}
        <Button outline title={details === r.code ? "بستن جزئیات" : "جزئیات و سابقه درخواست"} onPress={() => setDetails(v => v === r.code ? "" : r.code)} />
        {details === r.code && r.history.map((h, i) => <Text key={i}>{paymentDate(h.createdAt)} — {settlementActions[h.action] || h.action}: {h.note}</Text>)}
        {r.status === "Pending" && <Button outline title="لغو درخواست و آزادسازی مبلغ" busy={busy} onPress={() => void run(() => request(`/Settlement/Requests/${encodeURIComponent(r.code)}/Actions`, { method: "POST", data: { action: "Cancel" } }), "درخواست لغو شد و مبلغ آزاد شد.")} />}
      </Card>)}
      <Text bold>درآمد سفارش‌ها</Text>{income.data?.items.length === 0 && <Text muted>هنوز درآمدی ثبت نشده است.</Text>}{income.data?.items.map(x => <Card key={x.orderCode}><Text bold>سفارش {x.orderCode}: {money(x.netAmount)}</Text><Text>آزادشده: {money(x.releasedAmount)} · باقی‌مانده: {money(x.netAmount - x.releasedAmount)}</Text><Text>کارمزد: {x.commissionRate}٪ · مالیات: {x.taxRate}٪</Text></Card>)}
      <View style={{ flexDirection: "row-reverse", gap: 12 }}><Button title="قبلی" disabled={page === 1} onPress={() => setPage(p => p - 1)} /><Text>صفحه {page}</Text><Button title="بعدی" disabled={page * 20 >= Math.max(q.data?.totalCount || 0, income.data?.totalCount || 0)} onPress={() => setPage(p => p + 1)} /></View>
    </>}
  </View>;
}
