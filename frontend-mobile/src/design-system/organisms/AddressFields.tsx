import React from "react";
import { Switch, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { platformApi } from "../../api/platform";
import { Field } from "../atoms/Field";
import { Text } from "../atoms/Text";
import { Select } from "../molecules/Select";
import { QueryState } from "../molecules/QueryState";
import { LocationMap } from "./LocationMap";
import type { AddressInput } from "../../shared/types/platform";
export const emptyAddress: AddressInput = {
  street: "",
  postalCode: "",
  provinceCode: "",
  countyCode: "",
  cityCode: "",
  villageCode: "",
  isDefault: false,
};
export function validateAddress(a: AddressInput, postalRequired = true) {
  if (
    !a.street.trim() ||
    (postalRequired && !a.postalCode.trim()) ||
    !a.provinceCode ||
    !a.countyCode
  )
    throw new Error(
      postalRequired
        ? "استان، شهرستان، نشانی و کد پستی الزامی است"
        : "استان، شهرستان و نشانی الزامی است",
    );
  if (a.postalCode.trim() && !/^\d{10}$/.test(a.postalCode))
    throw new Error("کد پستی باید ۱۰ رقم باشد");
}
export function AddressFields({
  value,
  onChange,
  postalRequired = true,
  showDefault = true,
}: {
  value: AddressInput;
  onChange: (a: AddressInput) => void;
  postalRequired?: boolean;
  showDefault?: boolean;
}) {
  const provinces = useQuery({
    queryKey: ["provinces"],
    queryFn: platformApi.provinces,
  });
  const counties = useQuery({
    queryKey: ["counties", value.provinceCode],
    queryFn: () => platformApi.counties(value.provinceCode),
    enabled: !!value.provinceCode,
  });
  const locations = useQuery({
    queryKey: ["locations", value.countyCode],
    queryFn: () => platformApi.countyLocations(value.countyCode),
    enabled: !!value.countyCode,
  });
  const patch = (p: Partial<AddressInput>) => onChange({ ...value, ...p });
  return (
    <>
      <QueryState
        error={provinces.error || counties.error || locations.error}
        retry={() => {
          provinces.refetch();
          if (value.provinceCode) counties.refetch();
          if (value.countyCode) locations.refetch();
        }}
      />
      <Select
        label="استان"
        required
        value={value.provinceCode}
        onChange={(provinceCode) =>
          patch({
            provinceCode,
            countyCode: "",
            cityCode: "",
            villageCode: "",
            latitude: null,
            longitude: null,
          })
        }
        options={(provinces.data || []).map((p) => ({
          value: p.code,
          label: p.name,
        }))}
      />
      <Select
        label="شهرستان"
        required
        value={value.countyCode}
        disabled={!value.provinceCode}
        onChange={(countyCode) =>
          patch({
            countyCode,
            cityCode: "",
            villageCode: "",
            latitude: null,
            longitude: null,
          })
        }
        options={(counties.data || []).map((p) => ({
          value: p.code,
          label: p.name,
        }))}
      />
      <Select
        label="شهر / روستا"
        value={value.cityCode || value.villageCode}
        disabled={!value.countyCode}
        onChange={(code) => {
          const place = locations.data?.find((p) => p.code === code);
          const village = /village|روستا/i.test(place?.type || "");
          patch({
            latitude: null,
            longitude: null,
            cityCode: village ? "" : code,
            villageCode: village ? code : "",
          });
        }}
        options={(locations.data || []).map((p) => ({
          value: p.code,
          label: p.name,
        }))}
      />
      <Field
        label="نشانی کامل"
        required
        multiline
        value={value.street}
        onChangeText={(street) => patch({ street })}
      />
      <Field
        label={postalRequired ? "کد پستی" : "کد پستی (اختیاری)"}
        maxLength={10}
        required={postalRequired}
        keyboardType="number-pad"
        value={value.postalCode}
        onChangeText={(postalCode) =>
          patch({
            postalCode: postalCode.replace(/[۰-۹]/g, (c) =>
              String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)),
            ),
          })
        }
      />
      {showDefault && (
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 10,
            marginBottom: 15,
          }}
        >
          <Text>آدرس پیش‌فرض</Text>
          <Switch
            value={value.isDefault}
            onValueChange={(isDefault) => patch({ isDefault })}
          />
        </View>
      )}
      <LocationMap
        placeQuery={[
          locations.data?.find(
            (p) => p.code === (value.cityCode || value.villageCode),
          )?.name,
          provinces.data?.find((p) => p.code === value.provinceCode)?.name,
        ]
          .filter(Boolean)
          .join("، ")}
        value={
          value.latitude != null && value.longitude != null
            ? { latitude: value.latitude, longitude: value.longitude }
            : null
        }
        onChange={(p) => patch(p)}
      />
    </>
  );
}
