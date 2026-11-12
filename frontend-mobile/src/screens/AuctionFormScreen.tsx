import { PersianDateTimeField } from "../design-system/molecules/PersianDateTimeField";
import { persianToISO } from "../shared/utils/persian-date";
import { dateError } from "../shared/utils/persian-calendar";
import { amountDigits, formatAmount } from "../shared/utils/amount";
import React, { useState } from "react";
import { platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Card } from "../design-system/atoms/Card";
import { Text } from "../design-system/atoms/Text";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { AuthGate } from "../design-system/organisms/AuthGate";
import { ProductPicker } from "../design-system/organisms/ProductPicker";
import { useAction } from "../shared/hooks/useAction";
import { quantity } from "../shared/utils/format";
import type { Props } from "../navigation/types";
export function AuctionFormScreen({ navigation }: Props<"AuctionForm">) {
  const [product, setProduct] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [amount, setAmount] = useState("");
  const { busy, run } = useAction();
  const status = process.env.EXPO_PUBLIC_AUCTION_OPEN_STATUS_CODE;
  return (
    <AuthGate>
      <Screen>
        <Card>
          <ProductPicker value={product} onChange={setProduct} />
          <PersianDateTimeField
            label="زمان شروع"
            maxDaysAhead={20}
            value={start}
            onChangeText={setStart}
          />
          <PersianDateTimeField
            label="زمان پایان"
            maxDaysAhead={20}
            value={end}
            onChangeText={setEnd}
          />
          <Field
            label="قیمت پایه (تومان)"
            value={formatAmount(amount)}
            onChangeText={(text) => setAmount(amountDigits(text))}
            keyboardType="numeric"
          />
          {!status && (
            <Text muted>
              ثبت حراج در حال حاضر در دسترس نیست. لطفاً بعداً دوباره مراجعه
              کنید.
            </Text>
          )}
          <Button
            busy={busy}
            disabled={!status}
            title="ایجاد حراجی"
            onPress={() =>
              run(async () => {
                const scheduleError =
                  dateError(start, { maxDaysAhead: 20 }) ||
                  dateError(end, { maxDaysAhead: 20 });
                if (scheduleError) throw new Error(scheduleError);
                const startDate = persianToISO(start),
                  endDate = persianToISO(end);
                if (
                  !product ||
                  Date.parse(endDate) <= Date.parse(startDate) ||
                  !Number.isFinite(quantity(amount)) ||
                  quantity(amount) <= 0
                )
                  throw new Error("محصول، زمان و قیمت پایه معتبر وارد کنید");
                const a = await platformApi.createAuction({
                  agriculturalProductCode: product,
                  startDate,
                  endDate,
                  startingPrice: quantity(amount),
                  statusCode: status!,
                });
                navigation.replace("Auction", { code: a.code });
              })
            }
          />
        </Card>
      </Screen>
    </AuthGate>
  );
}
