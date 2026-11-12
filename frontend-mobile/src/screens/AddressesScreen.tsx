import { OptionalSection } from "../design-system/molecules/OptionalSection";
import { appAlert as Alert } from "../shared/alerts";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../api/platform";
import { useAction } from "../shared/hooks/useAction";
import { useAuth } from "../shared/providers/AuthProvider";
import { AuthGate } from "../design-system/organisms/AuthGate";
import {
  AddressFields,
  emptyAddress,
  validateAddress,
} from "../design-system/organisms/AddressFields";
import { LocationMap } from "../design-system/organisms/LocationMap";
import { Screen } from "../design-system/templates/Screen";
import { Card } from "../design-system/atoms/Card";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import type { AddressInput } from "../shared/types/platform";
import type { Props } from "../navigation/types";
export function AddressesScreen({ navigation }: Props<"Addresses">) {
  const q = useQuery({
    queryKey: ["addresses"],
    queryFn: () => platformApi.addresses(),
    enabled: useAuth().signedIn,
  });
  const { busy, run } = useAction();
  return (
    <AuthGate>
      <Screen>
        <Button
          title="افزودن آدرس"
          onPress={() => navigation.navigate("AddressForm")}
        />
        <QueryState
          loading={q.isLoading}
          error={q.error}
          empty={q.data?.items.length === 0}
          retry={() => q.refetch()}
        />
        {q.data?.items.map((a) => (
          <Card key={a.code} style={{ marginTop: 12 }}>
            <Text bold>
              {a.provinceName}، {a.cityName || a.countyName}
            </Text>
            <Text>{a.street}</Text>
            <Text muted>
              کد پستی: {a.postalCode} {a.isDefault ? " • پیش‌فرض" : ""}
            </Text>
            {a.latitude != null && a.longitude != null && (
              <OptionalSection title="نمایش موقعیت روی نقشه">
                <LocationMap
                  height={170}
                  value={{ latitude: a.latitude, longitude: a.longitude }}
                />
              </OptionalSection>
            )}
            <Button
              outline
              title="ویرایش"
              onPress={() =>
                navigation.navigate("AddressForm", { code: a.code })
              }
            />
            <Button
              outline
              disabled={busy}
              title="حذف آدرس"
              onPress={() =>
                Alert.alert("حذف آدرس", "این آدرس حذف شود؟", [
                  { text: "انصراف", style: "cancel" },
                  {
                    text: "حذف",
                    style: "destructive",
                    onPress: () => run(() => platformApi.deleteAddress(a.code)),
                  },
                ])
              }
            />
          </Card>
        ))}
      </Screen>
    </AuthGate>
  );
}
export function AddressFormScreen({ route, navigation }: Props<"AddressForm">) {
  const code = route.params?.code;
  const q = useQuery({
    queryKey: ["addresses"],
    queryFn: () => platformApi.addresses(),
    enabled: useAuth().signedIn && !!code,
  });
  const [value, setValue] = useState<AddressInput>({ ...emptyAddress });
  useEffect(() => {
    const a = q.data?.items.find((x) => x.code === code);
    if (a) setValue(a);
  }, [q.data, code]);
  const { busy, run } = useAction();
  return (
    <AuthGate>
      <Screen>
        <Card>
          <QueryState
            loading={!!code && q.isLoading}
            error={q.error}
            retry={() => q.refetch()}
          />
          <AddressFields value={value} onChange={setValue} />
          <Button
            busy={busy}
            disabled={!!code && !q.data}
            title="ذخیرهٔ آدرس"
            onPress={() =>
              run(async () => {
                validateAddress(value);
                if (code)
                  await platformApi.updateAddress({
                    ...value,
                    addressCode: code,
                  });
                else await platformApi.createAddress(value);
                navigation.goBack();
              })
            }
          />
        </Card>
      </Screen>
    </AuthGate>
  );
}
