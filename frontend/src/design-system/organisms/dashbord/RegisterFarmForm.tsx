"use client";


import Button from "@/design-system/atoms/Button";
import Input from "@/design-system/atoms/Input";
import { SelectBox } from "@/design-system/atoms/SelectBox";
import { IProvinces } from "@/shared/types/city";
import { useLocationData } from "@/hooks/queries/useCounties";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import useCreateFarm from "@/hooks/mutations/useCreateFarm";
import toast from "react-hot-toast";

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
};

const RegisterFarmForm = ({ provinces }: RegisterFarmFormProps) => {
  const { control, handleSubmit, watch, setValue, register, reset } =
    useForm<FormValues>();

  const selectedProvinceCode = watch("province");
  const selectedCountyCode = watch("county");

  const { data: counties } = useLocationData("counties", selectedProvinceCode);
  const { data: cities } = useLocationData(
    "cityAndVillage",
    selectedCountyCode
  );

  const { createFarm } = useCreateFarm();

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    createFarm.mutate(
      {
        name: data.farmName,
        description: data.farmDescription,
        address: {
          street: data.address,
          postalCode: data.postalCode,
          latitude: 0,
          longitude: 0,
          isDefault: false,
          provinceCode: data.province,
          countyCode: data.county,
          cityCode: data.city,
          villageCode: "",
        },
        capacity: 0,
        minPurchase: Number(data?.minPurchase),
      },
      {
        onSuccess: (data) => {
          toast.success(data?.message || "فرم با موفقیت ارسال شد");
          reset();
        },
        onError: () => toast.error("خطا در ارسال فرم"),
      }
    );
  };

  return (
    <form className="space-y-6 w-full" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-xl font-bold text-center">ثبت مزرعه</h2>

    
      <Controller
        control={control}
        name="farmName"
        render={({ field }) => (
          <Input placeholder="اسم کامل مزرعه" {...field} />
        )}
      />

      <Controller
        control={control}
        name="farmDescription"
        render={({ field }) => (
          <Input placeholder="توضیحات کامل مزرعه..." {...field} />
        )}
      />

      <Controller
        name="province"
        control={control}
        render={({ field }) => (
          <SelectBox
            label="استان"
            options={provinces?.map((p) => p.name) ?? []}
            value={provinces?.find((p) => p.code === field.value)?.name || ""}
            onChange={(name) => {
              const found = provinces?.find((p) => p.name === name);
              setValue("province", found?.code ?? "");
              setValue("county", "");
              setValue("city", "");
            }}
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
              setValue("city", found?.code ?? "");
            }}
          />
        )}
      />

   
      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <Input placeholder="آدرس دقیق مزرعه" {...field} />
        )}
      />

   
      <Controller
        control={control}
        name="postalCode"
        render={({ field }) => (
          <Input placeholder="کد پستی" type="number" {...field} />
        )}
      />

  
      <input
        type="number"
        placeholder="حداقل مبلغ خرید (ریال)"
        {...register("minPurchase", {
          onChange: (e) => {
            const clean = e.target.value.replace(
              /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,
              ""
            );
            e.target.value = clean;
          },
        })}
        className="w-full p-2 rounded-md border-2"
      />

      <Button variant="success" className="w-full" type="submit">
        ثبت نهایی مزرعه
      </Button>
    </form>
  );
};

export default RegisterFarmForm;

