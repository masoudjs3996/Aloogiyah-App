import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/mobile";
import { Select } from "../molecules/Select";
import { Field } from "../atoms/Field";
import { QueryState } from "../molecules/QueryState";
export function ProductPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [name, setName] = useState("");
  const q = useQuery({
    queryKey: ["products", "picker", name],
    queryFn: () => api.commerceProducts({ Name: name || undefined, PageSize: 40 }),
  });
  return (
    <>
      <Field label="جست‌وجوی محصول" value={name} onChangeText={setName} />
      <QueryState error={q.error} retry={() => q.refetch()} />
      <Select
        label="محصول"
        value={value}
        onChange={onChange}
        options={
          q.data?.items.map((p) => ({ value: p.code, label: p.name })) || []
        }
      />
    </>
  );
}
