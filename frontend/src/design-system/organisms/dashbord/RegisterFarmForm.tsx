"use client";
import { amountDigits, formatAmount } from "@/shared/utils/amount";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";

import ActionBar from "@/design-system/molecules/platform/ActionBar";
import Button from "@/design-system/atoms/Button";
import Input from "@/design-system/atoms/Input";
import Textarea from "@/design-system/atoms/Textarea";
import { SelectBox } from "@/design-system/atoms/SelectBox";

import type { IProvinces } from "@/shared/types/city";
import { useLocationData } from "@/hooks/queries/useCounties";
import useCreateFarm from "@/hooks/mutations/useCreateFarm";

import Map from "../dashbord/map/Map";

import { FaUpload } from "react-icons/fa";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import {
  TbBuildingBridge2,
  TbFileDescription,
} from "react-icons/tb";
import { LiaAddressCard } from "react-icons/lia";
import { BsCashCoin, BsSignpost2 } from "react-icons/bs";
import { BiMapPin } from "react-icons/bi";
import { AiOutlineHome } from "react-icons/ai";

/* -------------------- Types -------------------- */

type RegisterFarmFormProps = {
  provinces: IProvinces[] | null | undefined;
};

type SelectedPlace = {
  code: string;
  name: string;
  type: "City" | "Village";
};

type MapPoint = {
  lat: number;
  lng: number;
};

type FormValues = {
  farmName: string;
  farmDescription: string;
  province: string;
  county: string;
  city: string;
  address: string;
  postalCode: string;
  minPurchase: string;
  capacity: string;
  selectedLocation?: SelectedPlace;
};

/* -------------------- Component -------------------- */

const RegisterFarmForm = ({
  provinces,
}: RegisterFarmFormProps) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    register,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      farmName: "",
      farmDescription: "",
      province: "",
      county: "",
      city: "",
      address: "",
      postalCode: "",
      minPurchase: "",
      capacity: "",
      selectedLocation: undefined,
    },
  });

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);

  // مختصات فقط بعد از تأیید روی نقشه ذخیره می‌شود.
  const [location, setLocation] = useState<MapPoint | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  /* -------------------- انتخاب‌های فرم -------------------- */

  const selectedProvinceCode = watch("province");
  const selectedCountyCode = watch("county");
  const selectedCityCode = watch("city");
  const selectedPlace = watch("selectedLocation");

  /* -------------------- دریافت شهرستان و شهر/روستا -------------------- */

  const { data: counties } = useLocationData(
    "counties",
    selectedProvinceCode,
  );

  const { data: cities } = useLocationData(
    "cityAndVillage",
    selectedCountyCode,
  );

  /* -------------------- نام‌های ارسالی به نقشه -------------------- */

  const provinceName = provinces?.find(
    (item) => item.code === selectedProvinceCode,
  )?.name;

  const countyName = counties?.find(
    (item) => item.code === selectedCountyCode,
  )?.name;

  const currentPlace =
    selectedCityCode &&
    selectedPlace?.code === selectedCityCode
      ? selectedPlace
      : undefined;

  const cityName =
    currentPlace?.type === "City"
      ? currentPlace.name
      : undefined;

  const villageName =
    currentPlace?.type === "Village"
      ? currentPlace.name
      : undefined;

  const { createFarm } = useCreateFarm();

  /* -------------------- تصویر -------------------- */

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    // خواندن تصویر بدون ایجاد URL موقت
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  /* -------------------- ارسال فرم -------------------- */

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const latitude = Number(manualLat);
    const longitude = Number(manualLng);
    const manualLocation = manualLat.trim() && manualLng.trim() &&
      latitude >= 24.5 && latitude <= 40 && longitude >= 44 && longitude <= 63.5
      ? { lat: latitude, lng: longitude }
      : null;
    const farmLocation = manualLocation ?? location;

    if (!imageFile) {
      toast.error("لطفا یک تصویر انتخاب کنید");
      return;
    }

    if (!farmLocation) {
      toast.error(
        "موقعیت مزرعه را روی نقشه انتخاب کنید یا مختصات معتبر وارد کنید",
      );
      return;
    }

    const formData = new FormData();

    formData.append("Name", data.farmName.trim());
    formData.append(
      "Description",
      data.farmDescription.trim(),
    );
    formData.append("MinPurchase", data.minPurchase || "0");
    if (data.capacity.trim()) formData.append("Capacity", data.capacity);

    formData.append("Address.Street", data.address.trim());
    formData.append(
      "Address.PostalCode",
      data.postalCode.trim(),
    );
    formData.append(
      "Address.Latitude",
      String(farmLocation.lat),
    );
    formData.append(
      "Address.Longitude",
      String(farmLocation.lng),
    );
    formData.append("Address.IsDefault", "false");

    formData.append(
      "Address.ProvinceCode",
      data.province || "",
    );
    formData.append(
      "Address.CountyCode",
      data.county || "",
    );

    const place =
      data.city && data.selectedLocation?.code === data.city
        ? data.selectedLocation
        : undefined;

    if (place?.type === "Village") {
      formData.append("Address.CityCode", "");
      formData.append("Address.VillageCode", place.code);
    } else {
      formData.append(
        "Address.CityCode",
        place?.code || data.city || "",
      );
      formData.append("Address.VillageCode", "");
    }

    formData.append("Image", imageFile);

    createFarm.mutate(formData, {
      onSuccess: (response) => {
        toast.success(
          response?.message || "مزرعه با موفقیت ثبت شد",
        );

        reset();
        setLocation(null);
        setManualLat("");
        setManualLng("");
        setImageFile(null);
        setImagePreview(null);
      },
      onError: () => {
        toast.error("خطا در ثبت مزرعه");
      },
    });
  };

  return (
    <form
      dir="rtl"
      className="register-farm-form mx-auto w-full max-w-6xl space-y-8 pb-10"
      onSubmit={handleSubmit(onSubmit)}
    >
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">ثبت مزرعه</h1>
        <p className="mt-2 text-sm text-slate-500">مشخصات مزرعه، نشانی و موقعیت آن را ثبت کنید.</p>
      </header>

      {/* -------------------- تصویر و مشخصات -------------------- */}
      <section className="space-y-5">
        <h2 className="text-base font-bold text-slate-800">مشخصات مزرعه</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative flex min-h-44 flex-col overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="تصویر مزرعه"
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-32 items-center justify-center text-slate-500">
              <FaUpload className="ml-2 text-emerald-700" />
              تصویر مزرعه <span className="text-red-500">*</span>
            </div>
          )}

          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-slate-50">
            {imagePreview ? "تغییر تصویر" : "انتخاب تصویر"}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        <div className="flex flex-col gap-y-5">
          <Controller
            control={control}
            name="farmName"
            render={({ field }) => (
              <Input
                {...field}
                placeholder="نام کامل مزرعه"
                required lable="نام مزرعه:"
                icon={
                  <MdOutlineDriveFileRenameOutline
                    size={24}
                    className="text-slate-700"
                  />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="farmDescription"
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="توضیحات کامل مزرعه..."
                className="min-h-28"
                lable="توضیحات مزرعه:"
                icon={
                  <TbFileDescription
                    size={24}
                    className="text-slate-700"
                  />
                }
              />
            )}
          />
        </div>
      </div>
      </section>

      {/* -------------------- استان، شهرستان، شهر/روستا -------------------- */}
      <section className="space-y-5 border-t border-slate-200 pt-7">
        <h2 className="text-base font-bold text-slate-800">نشانی مزرعه</h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Controller
          name="province"
          control={control}
          render={({ field }) => (
            <SelectBox
              required label="استان:"
              placeholder="انتخاب استان"
              options={provinces?.map((p) => p.name) ?? []}
              value={
                provinces?.find(
                  (p) => p.code === field.value,
                )?.name || ""
              }
              onChange={(name) => {
                const found = provinces?.find(
                  (p) => p.name === name,
                );

                setValue("province", found?.code ?? "");
                setValue("county", "");
                setValue("city", "");
                setValue("selectedLocation", undefined);

                setLocation(null);
              }}
              icon={
                <BiMapPin
                  size={24}
                  className="text-slate-700"
                />
              }
            />
          )}
        />

        <Controller
          name="county"
          control={control}
          render={({ field }) => (
            <SelectBox
              required label="شهرستان"
              options={
                selectedProvinceCode
                  ? counties?.map((c) => c.name) ?? []
                  : []
              }
              value={
                counties?.find(
                  (c) => c.code === field.value,
                )?.name || ""
              }
              onChange={(name) => {
                const found = counties?.find(
                  (c) => c.name === name,
                );

                setValue("county", found?.code ?? "");
                setValue("city", "");
                setValue("selectedLocation", undefined);

                setLocation(null);
              }}
              icon={
                <TbBuildingBridge2
                  size={24}
                  className="text-slate-700"
                />
              }
            />
          )}
        />

        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <SelectBox
              label="شهر یا روستا"
              options={
                selectedCountyCode
                  ? cities?.map((c) => c.name) ?? []
                  : []
              }
              value={
                cities?.find(
                  (c) => c.code === field.value,
                )?.name || ""
              }
              onChange={(name) => {
                const found = cities?.find(
                  (c) => c.name === name,
                );

                setValue("city", found?.code ?? "");

                if (
                  found &&
                  (found.type === "City" ||
                    found.type === "Village")
                ) {
                  setValue("selectedLocation", {
                    code: found.code,
                    name: found.name,
                    type: found.type,
                  });
                } else {
                  setValue("selectedLocation", undefined);
                }

                setLocation(null);
              }}
              icon={
                <AiOutlineHome
                  size={24}
                  className="text-slate-700"
                />
              }
            />
          )}
        />
      </div>

      {/* -------------------- آدرس و مبلغ -------------------- */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="آدرس دقیق مزرعه"
              required lable="آدرس مزرعه:"
              icon={
                <LiaAddressCard
                  size={24}
                  className="text-slate-700"
                />
              }
            />
          )}
        />

        <Controller
          control={control}
          name="postalCode"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="کد پستی"
              type="text"
              inputMode="numeric"
              lable="کد پستی (اختیاری):"
              icon={
                <BsSignpost2
                  size={24}
                  className="text-slate-700"
                />
              }
            />
          )}
        />

        <div><p className="mb-2 text-xs leading-6 text-slate-500">ظرفیت تولید روزانه، ماهانه یا سالانهٔ مزرعه را به‌صورت تقریبی وارد کنید؛ دوره و واحد تولید را در توضیحات مزرعه بنویسید.</p><Controller control={control} name="capacity" render={({field}) => <Input lable="ظرفیت تولید تقریبی (اختیاری)" inputMode="numeric" value={formatAmount(field.value || "")} onChange={event => field.onChange(amountDigits(event.target.value))} />} /></div>
        <Controller control={control} name="minPurchase" render={({field}) => <Input lable="حداقل مبلغ خرید (تومان)" placeholder="مثلاً ۱٬۰۰۰٬۰۰۰" type="text" inputMode="numeric" dir="ltr" name={field.name} ref={field.ref} onBlur={field.onBlur} value={formatAmount(field.value || "")} onChange={event => field.onChange(amountDigits(event.target.value))} />} />
      </div>
      </section>

      {/* -------------------- نقشه -------------------- */}
      <section className="space-y-4 border-t border-slate-200 pt-7">
        <div>
          <h2 className="text-base font-bold text-slate-800">موقعیت روی نقشه <span className="text-red-500">*</span></h2>
          <p className="mt-1 text-sm text-slate-500">روی نقشه نقطه مزرعه را انتخاب و تأیید کنید.</p>
        </div>

        <Map
          key={JSON.stringify([
            selectedProvinceCode,
            selectedCountyCode,
            selectedCityCode,
          ])}
          pickLocation
          onConfirmLocation={(point) => {
            setManualLat("");
            setManualLng("");
            setLocation(point);
          }}
          provinceName={provinceName}
          cityName={
            cityName ||
            (villageName ? countyName : undefined)
          }
          villageName={villageName}
          className="h-[320px] sm:h-[380px]"
        />

        {location && (
          <p className="text-sm font-medium text-emerald-700">
            موقعیت مزرعه تأیید شد.
          </p>
        )}
        <details className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">ورود مختصات به‌صورت دستی</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-700">عرض جغرافیایی
              <input type="number" step="any" min="24.5" max="40" value={manualLat} onChange={(event) => { setManualLat(event.target.value); setLocation(null); }} placeholder="مثلاً 35.6892" dir="ltr" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left" />
            </label>
            <label className="text-sm text-slate-700">طول جغرافیایی
              <input type="number" step="any" min="44" max="63.5" value={manualLng} onChange={(event) => { setManualLng(event.target.value); setLocation(null); }} placeholder="مثلاً 51.3890" dir="ltr" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-left" />
            </label>
          </div>
        </details>
      </section>

      <ActionBar className="border-t border-slate-200 pt-6">
          <Button variant="secondary" type="submit" disabled={createFarm.isPending}>
            {createFarm.isPending ? "در حال ثبت مزرعه..." : "ثبت نهایی مزرعه"}
          </Button>
      </ActionBar>
    </form>
  );
};

export default RegisterFarmForm;
