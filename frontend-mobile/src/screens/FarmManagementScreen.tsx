import { Pagination } from "../design-system/molecules/Pagination";
import { View, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ManagementPhoto } from "../design-system/molecules/ManagementPhoto";
import { amountDigits, formatAmount } from "../shared/utils/amount";
import { RegistrationHeading } from "../design-system/molecules/RegistrationSection";
import { FarmDeliveryPoint } from "../design-system/organisms/FarmDeliveryPoint";
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/mobile";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import { AuthGate } from "../design-system/organisms/AuthGate";
import {
  AddressFields,
  emptyAddress,
  validateAddress,
} from "../design-system/organisms/AddressFields";
import {
  appendImage,
  ImageUpload,
} from "../design-system/organisms/ImageUpload";
import { useAuth } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { useListSearch } from "../shared/hooks/useListSearch";
import { theme } from "../shared/theme";
import { imageUrl, quantity } from "../shared/utils/format";
import type { AddressInput } from "../shared/types/platform";
import type { PickedImage } from "../shared/types/mobile";
import type { Props } from "../navigation/types";
export function MyFarmsScreen({ navigation }: Props<"MyFarms">) {
  const { page, setPage, search, name, setSearch } = useListSearch();
  const { width } = useWindowDimensions();
  const q = useQuery({
    queryKey: ["my-farms", name, page],
    queryFn: ({ signal }) => api.myFarms(page, name, signal),
    enabled: useAuth().signedIn,
  });
  return (
    <AuthGate>
      <Screen>
        <Button
          title="ثبت مزرعه"
          icon={<Ionicons name="add" size={19} color={theme.white} />}
          onPress={() => navigation.navigate("FarmForm")}
        />
        <View style={{ marginTop: 16 }}>
          <Field
            label="جست‌وجوی مزرعه"
            placeholder="نام مزرعه"
            icon={<Ionicons name="search" size={19} color={theme.muted} />}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <QueryState
          loading={q.isLoading}
          error={q.error}
          empty={q.data?.items.length === 0}
          emptyText={name ? "مزرعه‌ای پیدا نشد" : "هنوز مزرعه‌ای ثبت نشده است"}
          retry={() => q.refetch()}
        />
        <View
          style={{
            flexDirection: "row-reverse",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {q.data?.items.map((f) => {
            const location = [f.provinceName, f.countyName]
              .filter(Boolean)
              .join("، ");
            const info = [location, f.statusName].filter(Boolean).join(" | ");
            return (
              <Card
                key={f.code}
                style={{
                  width: width >= 640 ? "49%" : "100%",
                  padding: 0,
                  gap: 0,
                  overflow: "hidden",
                }}
              >
                <ManagementPhoto
                  uri={imageUrl(f.farmImageUrl)}
                  label={`تصویر مزرعه ${f.name}`}
                  style={{ height: 176 }}
                />
                <View style={{ padding: 16, gap: 10, flex: 1 }}>
                  <Text bold style={{ fontSize: 17 }}>
                    {f.name}
                  </Text>
                  {!!info && (
                    <Text muted style={{ fontSize: 12 }}>
                      {info}
                    </Text>
                  )}
                  <Text numberOfLines={3} muted style={{ flexGrow: 1 }}>
                    {f.description || "توضیحی ثبت نشده است"}
                  </Text>
                  <Button
                    outline
                    title="ویرایش اطلاعات مزرعه"
                    icon={
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color={theme.green}
                      />
                    }
                    onPress={() =>
                      navigation.navigate("FarmForm", { code: f.code })
                    }
                  />
                  <Button
                    title="مدیریت آگهی‌ها"
                    onPress={() =>
                      navigation.navigate("FarmProducts", { farm: f.code })
                    }
                  />
                </View>
              </Card>
            );
          })}
        </View>
        <Pagination
          page={page}
          pageSize={q.data?.pageSize || 12}
          totalCount={q.data?.totalCount || 0}
          busy={q.isFetching}
          onChange={setPage}
        />
      </Screen>
    </AuthGate>
  );
}
export function FarmFormScreen({ route, navigation }: Props<"FarmForm">) {
  const code = route.params?.code;
  const signedIn = useAuth().signedIn;
  const q = useQuery({
    queryKey: ["farm", code],
    queryFn: () => api.farm(code!),
    enabled: !!code && signedIn,
  });
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [description, setDesc] = useState("");
  const [capacity, setCap] = useState("");
  const [min, setMin] = useState("");
  const [address, setAddress] = useState<AddressInput>({ ...emptyAddress });
  const [images, setImages] = useState<PickedImage[]>([]);
  const { busy, run } = useAction();
  const initialized = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (q.data && initialized.current !== code) {
      initialized.current = code;
      setName(q.data.name);
      setDesc(q.data.description);
      setCap(q.data.capacity == null ? "" : String(q.data.capacity));
      setMin(String(q.data.minPurchase));
      if (q.data.address) setAddress(q.data.address);
    }
  }, [q.data, code]);
  if (code && !q.data)
    return (
      <AuthGate>
        <Screen>
          <QueryState
            loading={q.isLoading}
            error={q.error}
            retry={() => q.refetch()}
          />
        </Screen>
      </AuthGate>
    );
  return (
    <AuthGate>
      <Screen showHeading={false}>
        <RegistrationHeading
          large
          title={code ? "ویرایش مزرعه" : "ثبت مزرعه جدید"}
          description="مشخصات و نشانی مزرعه را تکمیل کنید. فیلدهای ستاره‌دار ضروری هستند."
        />
        <Card>
          <QueryState
            loading={!!code && q.isLoading}
            error={q.error}
            retry={() => q.refetch()}
          />
          <RegistrationHeading
            title="تصویر مزرعه"
            description="یک تصویر واضح و باکیفیت انتخاب کنید."
          />
          <ImageUpload
            existingUrls={[q.data?.imageUrl || ""]}
            files={images}
            onChange={setImages}
          />
        </Card>
        <Card>
          <RegistrationHeading title="مشخصات مزرعه" />
          <Field
            required
            label="نام مزرعه"
            error={
              submitted && !name.trim() ? "نام مزرعه را وارد کنید" : undefined
            }
            value={name}
            onChangeText={setName}
          />
          <Field
            label="توضیحات"
            value={description}
            onChangeText={setDesc}
            style={{ minHeight: 112, textAlignVertical: "top" }}
            multiline
          />
          <Field
            label="ظرفیت تولید تقریبی (اختیاری)"
            hint="دوره و واحد تولید را در توضیحات مزرعه بنویسید."
            value={capacity}
            onChangeText={(text) => setCap(amountDigits(text))}
            keyboardType="number-pad"
          />
          <Field
            label="حداقل خرید (تومان)"
            value={formatAmount(min)}
            onChangeText={(text) => setMin(amountDigits(text))}
            keyboardType="numeric"
          />
        </Card>
        <Card>
          <RegistrationHeading
            title="نشانی و موقعیت مزرعه"
            description="نشانی را کامل کنید و محل مزرعه را روی نقشه انتخاب کنید."
          />
          <AddressFields
            value={address}
            onChange={setAddress}
            postalRequired={false}
            showDefault={false}
          />
        </Card>
        {code && (
          <Card>
            <FarmDeliveryPoint code={code} />
          </Card>
        )}
        <Card>
          <Text muted>اطلاعات و موقعیت مزرعه را بررسی و سپس ذخیره کنید.</Text>

          <Button
            busy={busy}
            title={code ? "ذخیره تغییرات مزرعه" : "ثبت مزرعه"}
            disabled={!!code && !q.data}
            onPress={() =>
              run(async () => {
                setSubmitted(true);
                validateAddress(address, false);
                if (
                  !name.trim() ||
                  !Number.isFinite(quantity(capacity)) ||
                  !Number.isFinite(quantity(min))
                )
                  throw new Error("نام، ظرفیت و حداقل خرید معتبر وارد کنید");
                if (code) {
                  await api.updateFarm({
                    code,
                    name,
                    description,
                    capacity: capacity.trim() ? quantity(capacity) : null,
                    minPurchase: quantity(min),
                    address: { ...address, addressCode: q.data!.address.code },
                  });
                  if (images[0]) {
                    const body = new FormData();
                    body.append("Code", code);
                    appendImage(body, "File", images[0]);
                    const { request } = await import("../api/platform");
                    await request("/Farm/UploadImage", {
                      method: "PATCH",
                      data: body,
                    });
                  }
                } else {
                  const body = new FormData();
                  body.append("Name", name);
                  body.append("Description", description);
                  if (capacity.trim())
                    body.append("Capacity", String(quantity(capacity)));
                  body.append("MinPurchase", String(quantity(min)));
                  Object.entries(address).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== "")
                      body.append(`Address.${k}`, String(v));
                  });
                  if (images[0]) appendImage(body, "Image", images[0]);
                  await api.createFarm(body);
                }
                navigation.goBack();
              }, "مزرعه ذخیره شد")
            }
          />
        </Card>
      </Screen>
    </AuthGate>
  );
}
