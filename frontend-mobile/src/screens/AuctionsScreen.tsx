import { Pagination } from "../design-system/molecules/Pagination";
import { usePollingInterval } from "../shared/hooks/usePollingInterval";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import { useAuth } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { money, date, quantity } from "../shared/utils/format";
import { useRoles } from "../shared/hooks/useRoles";
import type { Props } from "../navigation/types";
export function AuctionsScreen({ navigation }: Props<"Auctions">) {
  const roles = useRoles();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["auctions", page],
    queryFn: () => platformApi.auctions({ PageNumber: page, PageSize: 15 }),
    refetchInterval: usePollingInterval(15000),
  });

  return (
    <Screen>
      {roles.has("Farmer") && (
        <Button
          title="ایجاد حراجی"
          onPress={() => navigation.navigate("AuctionForm")}
        />
      )}
      <QueryState
        loading={q.isLoading}
        error={q.error}
        empty={q.data?.items.length === 0}
        retry={() => q.refetch()}
      />
      {q.data?.items.map((a) => (
        <Card key={a.code}>
          <Text bold style={{ fontSize: 20 }}>
            حراجی {a.code}
          </Text>
          <Text>قیمت فعلی: {money(a.currentPrice || a.startingPrice)}</Text>
          <Text muted>پایان: {date(a.endDate)}</Text>
          <Button
            outline
            title="مشاهده و پیشنهاد قیمت"
            onPress={() => navigation.navigate("Auction", { code: a.code })}
          />
        </Card>
      ))}
      <Pagination
        page={page}
        pageSize={q.data?.pageSize || 20}
        totalCount={q.data?.totalCount || 0}
        busy={q.isFetching}
        onChange={setPage}
      />
    </Screen>
  );
}
export function AuctionScreen({ route, navigation }: Props<"Auction">) {
  const q = useQuery({
    queryKey: ["auction", route.params.code],
    queryFn: () => platformApi.auction(route.params.code),
    refetchInterval: usePollingInterval(10000),
  });
  const [amount, setAmount] = useState("");
  const { busy, run } = useAction();
  const { signedIn } = useAuth();
  const a = q.data;
  return (
    <Screen>
      <QueryState
        loading={q.isLoading}
        error={q.error}
        retry={() => q.refetch()}
      />
      {a && (
        <Card>
          <Text bold style={{ fontSize: 23 }}>
            حراجی {a.code}
          </Text>
          <Button
            outline
            title="مشاهدهٔ محصول"
            onPress={() =>
              navigation.navigate("Product", {
                code: a.agriculturalProductCode,
              })
            }
          />
          <Text>
            شروع: {new Date(a.startDate).toLocaleString("fa-IR-u-ca-persian")}
          </Text>
          <Text>
            پایان: {new Date(a.endDate).toLocaleString("fa-IR-u-ca-persian")}
          </Text>
          <Text bold>
            قیمت فعلی: {money(a.currentPrice || a.startingPrice)}
          </Text>
          <Field
            label="پیشنهاد شما به تومان"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <Button
            title="ثبت پیشنهاد"
            busy={busy}
            disabled={
              Date.now() > Date.parse(a.endDate) ||
              Date.now() < Date.parse(a.startDate)
            }
            onPress={() =>
              signedIn
                ? run(async () => {
                    const n = quantity(amount);
                    if (
                      !Number.isFinite(n) ||
                      n <= (a.currentPrice || a.startingPrice)
                    )
                      throw new Error("پیشنهاد باید بیشتر از قیمت فعلی باشد");
                    await platformApi.bid({
                      auctionCode: a.code,
                      bidAmount: n,
                    });
                    setAmount("");
                  }, "پیشنهاد ثبت شد")
                : navigation.navigate("Login")
            }
          />

          <Text bold>پیشنهادهای ثبت‌شده</Text>
          {a.bids?.map((b) => (
            <Text key={b.code}>
              {money(b.bidAmount)} • {date(b.createdAt)}
            </Text>
          ))}
        </Card>
      )}
    </Screen>
  );
}
