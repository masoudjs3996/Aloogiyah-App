"use client";

import Button from "@/design-system/atoms/Button";
import Input from "@/design-system/atoms/Input";
import { SelectBox } from "@/design-system/atoms/SelectBox";
import { IProvinces } from "@/shared/types/city";
import { useLocationData } from "@/hooks/queries/useCounties";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import useCreateFarm from "@/hooks/mutations/useCreateFarm";
import toast from "react-hot-toast";
import { FaUpload } from "react-icons/fa";
import { useEffect, useState } from "react";
import Map from "./ExportMap";
import Textarea from "@/design-system/atoms/Textarea";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { TbBuildingBridge2, TbFileDescription } from "react-icons/tb";
import { LiaAddressCard } from "react-icons/lia";
import { BsCashCoin, BsSignpost2 } from "react-icons/bs";
import { BiMapPin } from "react-icons/bi";
import { AiOutlineHome } from "react-icons/ai";

type RegisterFarmFormProps = {
  provinces: IProvinces[] | null | undefined;
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
  selectedLocation?: { code: string; name: string; type: "City" | "Village" };
};

const RegisterFarmForm = ({ provinces }: RegisterFarmFormProps) => {
  const { control, handleSubmit, watch, setValue, register, reset } =
    useForm<FormValues>({
      defaultValues: {
        selectedLocation: undefined,
      },
    });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const selectedProvinceCode = watch("province");
  const selectedCountyCode = watch("county");

  const { data: counties } = useLocationData("counties", selectedProvinceCode);
  const { data: cities } = useLocationData(
    "cityAndVillage",
    selectedCountyCode,
  );
  const [location, setLocation] = useState({
    lat: 35.6892,
    lng: 51.389,
  });
  const { createFarm } = useCreateFarm();

  useEffect(() => {
    console.log(location);
  }, [location]);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!imageFile) {
      toast.error("لطفا یک تصویر انتخاب کنید");
      return;
    }

    const formData = new FormData();
    formData.append("Name", data.farmName?.trim());
    formData.append("Description", data.farmDescription?.trim());
    formData.append("MinPurchase", data.minPurchase || "0");
    formData.append("Capacity", "0");
    formData.append("Address.Street", data.address?.trim());
    formData.append("Address.PostalCode", data.postalCode?.trim());
    formData.append("Address.Latitude", String(location?.lat));
    formData.append("Address.Longitude", String(location?.lng));
    formData.append("Address.IsDefault", "false");
    formData.append("Address.ProvinceCode", data.province || "");
    formData.append("Address.CountyCode", data.county || "");
    // formData.append("Address.CityCode", data.city || "");
    // formData.append("Address.VillageCode", "");

    const selectedLocation = data.selectedLocation as any;

    if (selectedLocation?.type === "Village") {
      formData.append("Address.CityCode", "");
      formData.append("Address.VillageCode", selectedLocation.code);
    } else if (selectedLocation?.type === "City" || selectedLocation) {
      formData.append(
        "Address.CityCode",
        selectedLocation?.code || data.city || "",
      );
      formData.append("Address.VillageCode", "");
    } else {
      formData.append("Address.CityCode", "");
      formData.append("Address.VillageCode", "");
    }
    formData.append("Image", imageFile);

    createFarm.mutate(formData, {
      onSuccess: (response) => {
        toast.success(response?.message || "مزرعه با موفقیت ثبت شد");
        reset();
        setImageFile(null);
        setImagePreview(null);
      },
      onError: (error: any) => {
        console.error("خطا:", error);
        toast.error("خطا در ثبت مزرعه");
      },
    });
  };

  return (
    <form className="space-y-6 w-full" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-xl font-bold text-center">ثبت مزرعه</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl overflow-hidden shadow relative">
          {imagePreview ? (
            <img src={imagePreview} className="w-full object-cover max-h-40" />
          ) : (
            <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400">
              عکس محصول
            </div>
          )}
          <label className="absolute bottom-0 left-0 right-0 bg-black/40 text-white p-2 text-sm flex items-center justify-center gap-x-2 cursor-pointer">
            <FaUpload /> ویرایش عکس
            <input
              type="file"
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
                placeholder="نام کامل مزرعه"
                lable="نام مزرعه :"
                {...field}
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
                placeholder="توضیحات کامل مزرعه..."
                {...field}
                className="min-h-28"
                lable="توضیحات مزرعه :"
                icon={
                  <TbFileDescription size={24} className="text-slate-700" />
                }
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1  xl:grid-cols-3  gap-4">
        <Controller
          name="province"
          control={control}
          render={({ field }) => (
            <SelectBox
              label="استان :"
              placeholder="انتخاب استان"
              options={provinces?.map((p) => p.name) ?? []}
              value={provinces?.find((p) => p.code === field.value)?.name || ""}
              onChange={(name) => {
                const found = provinces?.find((p) => p.name === name);
                setValue("province", found?.code ?? "");
                setValue("county", "");
                setValue("city", "");
              }}
              icon={<BiMapPin size={24} className="text-slate-700" />}
            />
          )}
        />

        <Controller
          name="county"
          control={control}
          render={({ field }) => (
            <SelectBox
              label="شهرستان"
              options={counties?.map((c) => c.name) ?? []}
              value={counties?.find((c) => c.code === field.value)?.name || ""}
              onChange={(name) => {
                const found = counties?.find((c) => c.name === name);
                setValue("county", found?.code ?? "");
                setValue("city", "");
              }}
              icon={<TbBuildingBridge2 size={24} className="text-slate-700" />}
            />
          )}
        />

        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <SelectBox
              label="شهر یا روستا"
              options={cities?.map((c) => c.name) ?? []}
              value={cities?.find((c) => c.code === field.value)?.name || ""}
              onChange={(name) => {
                const found = cities?.find((c) => c.name === name);
                if (found) {
                  setValue("city", found.code);

                  setValue("selectedLocation", found as any);
                }
              }}
              icon={<AiOutlineHome size={24} className="text-slate-700" />}
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1  xl:grid-cols-3  gap-4">
        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <Input
              placeholder="آدرس دقیق مزرعه"
              {...field}
              lable="آدرس مزرعه :"
              icon={<LiaAddressCard size={24} className="text-slate-700" />}
            />
          )}
        />

        <Controller
          control={control}
          name="postalCode"
          render={({ field }) => (
            <Input
              placeholder="کد پستی"
              type="number"
              {...field}
              lable=" کد پستی :"
              icon={<BsSignpost2 size={24} className="text-slate-700" />}
            />
          )}
        />
        <Input
          placeholder="حداقل مبلغ خرید (ریال)"
          type="number"
          lable="حداقل مبلغ خرید :"
          icon={<BsCashCoin size={24} className="text-slate-700" />}
          {...register("minPurchase", {
            onChange: (e) => {
              const clean = e.target.value.replace(
                /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,
                "",
              );

              e.target.value = clean;
            },
          })}
        />
      </div>
      <div className="w-full h-[400px] overflow-hidden  relative space-y-2">
        <label
          htmlFor=""
          className=" block  text-sm font-medium text-slate-700"
        >
          موقعیت مزرعه روی نقشه :
        </label>
        <Map position={location} updatePosition={setLocation} isAdvertiseView />
      </div>
      <Button variant="secondary" className="w-full" type="submit">
        ثبت نهایی مزرعه
      </Button>
    </form>
  );
};

export default RegisterFarmForm;
