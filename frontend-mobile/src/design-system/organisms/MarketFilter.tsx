import React from "react";
import { useQuery } from "@tanstack/react-query";
import { deliveryApi } from "../../api/delivery";
import { errorMessage } from "../../api/platform";
import { Select } from "../molecules/Select";
import { Text } from "../atoms/Text";
import { Card } from "../atoms/Card";

export function MarketFilter({ pointCode, localOnly, onChange }: {
  pointCode: string; localOnly: boolean; onChange: (point: string, local: boolean) => void;
}) {
  const q = useQuery({ queryKey: ["public-delivery-points"], queryFn: deliveryApi.points, staleTime: 60000 });
  return <Card>
    <Select label="میدان بار (جست‌وجوی نام شهر یا میدان)" value={pointCode} disabled={q.isPending} onChange={v => onChange(v, true)} options={[{ value: "", label: "همه میدان‌ها" }, ...(q.data ?? []).map(p => ({ value: p.code, label: [p.name, p.countyName].filter(Boolean).join(" — ") }))]} />
    {q.isPending && <Text muted>در حال دریافت میدان‌ها…</Text>}
    {q.error && <Text onPress={() => void q.refetch()}>{errorMessage(q.error)}؛ برای تلاش دوباره لمس کنید.</Text>}
    {!!pointCode && <Select label="محصولات نمایش‌داده‌شده" value={localOnly ? "local" : "all"} onChange={v => onChange(pointCode, v === "local")} options={[
      { value: "local", label: "محصولات با مبدأ همین میدان" }, { value: "all", label: "همه محصولات قابل دریافت در این میدان" }
    ]} />}
    <Text muted>بار پس از ثبت سفارش به میدان می‌رسد. انتقال از میدان دیگر هزینه و زمان جدا دارد.</Text>
  </Card>;
}
