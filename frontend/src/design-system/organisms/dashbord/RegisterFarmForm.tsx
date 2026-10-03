"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";

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
      selectedLocation: undefined,
    },
  });

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);

  // مختصات فقط بعد از تأیید روی نقشه ذخیره می‌شود.
  const [location, setLocation] = useState<MapPoint | null>(null);

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
    if (!imageFile) {
      toast.error("لطفا یک تصویر انتخاب کنید");
      return;
    }

    if (!location) {
      toast.error(
        "موقعیت مزرعه را روی نقشه انتخاب و تأیید کنید",
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
    formData.append("Capacity", "0");

    formData.append("Address.Street", data.address.trim());
    formData.append(
      "Address.PostalCode",
      data.postalCode.trim(),
    );
    formData.append(
      "Address.Latitude",
      String(location.lat),
    );
    formData.append(
      "Address.Longitude",
      String(location.lng),
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
      className="w-full space-y-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 className="text-center text-xl font-bold">
        ثبت مزرعه
      </h2>

      {/* -------------------- تصویر و مشخصات -------------------- */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl shadow">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="تصویر مزرعه"
              className="max-h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 items-center justify-center bg-gray-100 text-gray-400">
              عکس مزرعه
            </div>
          )}

          <label className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center gap-x-2 bg-black/40 p-2 text-sm text-white">
            <FaUpload />
            انتخاب یا ویرایش عکس

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
                lable="نام مزرعه:"
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

      {/* -------------------- استان، شهرستان، شهر/روستا -------------------- */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Controller
          name="province"
          control={control}
          render={({ field }) => (
            <SelectBox
              label="استان:"
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
              label="شهرستان"
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
              lable="آدرس مزرعه:"
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
              lable="کد پستی:"
              icon={
                <BsSignpost2
                  size={24}
                  className="text-slate-700"
                />
              }
            />
          )}
        />

        <Input
          placeholder="حداقل مبلغ خرید (ریال)"
          type="number"
          lable="حداقل مبلغ خرید:"
          icon={
            <BsCashCoin
              size={24}
              className="text-slate-700"
            />
          }
          {...register("minPurchase", {
            onChange: (event) => {
              event.target.value =
                event.target.value.replace(
                  /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,
                  "",
                );
            },
          })}
        />
      </div>

      {/* -------------------- نقشه -------------------- */}

      <div className="w-full space-y-2">
        <p className="text-sm font-medium text-slate-700">
          موقعیت مزرعه روی نقشه:
        </p>

        <Map
          key={JSON.stringify([
            selectedProvinceCode,
            selectedCountyCode,
            selectedCityCode,
          ])}
          pickLocation
          onConfirmLocation={setLocation}
          provinceName={provinceName}
          cityName={
            cityName ||
            (villageName ? countyName : undefined)
          }
          villageName={villageName}
          className="h-[400px]"
        />

        {location && (
          <p className="text-sm text-green-700">
            موقعیت مزرعه تأیید شد.
          </p>
        )}
      </div>

      <Button
        variant="secondary"
        className="w-full"
        type="submit"
      >
        ثبت نهایی مزرعه
      </Button>
    </form>
  );
};

export default RegisterFarmForm;