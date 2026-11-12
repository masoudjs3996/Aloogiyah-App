import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "../../api/platform";
import { deliveryApi } from "../../api/delivery";
import { useAction } from "../../shared/hooks/useAction";
import { Select } from "../molecules/Select";
import { QueryState } from "../molecules/QueryState";
import { RegistrationHeading } from "../molecules/RegistrationSection";
import { Button } from "../atoms/Button";

export function FarmDeliveryPoint({ code }: { code: string }) {
  const [choice, setChoice] = useState<string>();
  const { busy, run } = useAction();
  const points = useQuery({
    queryKey: ["delivery-points"],
    queryFn: deliveryApi.points,
  });
  const current = useQuery({
    queryKey: ["farm-delivery", code],
    queryFn: () =>
      request<{ pointCode?: string }>(
        `/Delivery/FarmPoint/${encodeURIComponent(code)}`,
      ),
  });
  const selected = choice ?? current.data?.pointCode ?? "";
  return (
    <>
      <RegistrationHeading
        title="میدان تحویل محصولات"
        description="پس از سفارش، محصول را به این میدان می‌رسانید. ارسال به شهر خریدار از اینجا انجام می‌شود."
      />
      <QueryState
        loading={points.isLoading || current.isLoading}
        error={points.error || current.error}
        retry={() => {
          void points.refetch();
          void current.refetch();
        }}
      />
      <Select
        label="میدان تحویل مزرعه"
        value={selected}
        onChange={setChoice}
        disabled={
          busy ||
          points.isLoading ||
          current.isLoading ||
          !!current.error ||
          !!points.error
        }
        options={
          points.data?.map((p) => ({ value: p.code, label: p.name })) || []
        }
      />
      <Button
        outline
        title="ذخیره میدان تحویل"
        busy={busy}
        disabled={
          !selected ||
          current.isLoading ||
          !!current.error ||
          selected === current.data?.pointCode
        }
        onPress={() =>
          void run(async () => {
            await request(`/Delivery/FarmPoint/${encodeURIComponent(code)}`, {
              method: "PUT",
              data: { pointCode: selected },
            });
          }, "میدان تحویل ذخیره شد")
        }
      />
    </>
  );
}
