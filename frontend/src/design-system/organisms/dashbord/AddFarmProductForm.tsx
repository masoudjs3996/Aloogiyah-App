"use client";
import SaleUnitField from "@/design-system/molecules/platform/SaleUnitField";
import { amountDigits, formatAmount } from "@/shared/utils/amount";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { errorMessage, request } from "@/lib/actions/platform";
import { TextField } from "@/design-system/molecules/public";
import { IoPricetagsOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { useCreateProduct } from "@/hooks/mutations/useAddProduct";
import MultiImageUpload from "@/design-system/molecules/dashbord/MultiImageUploader";
import Textarea from "@/design-system/atoms/Textarea";
import { TbFileDescription } from "react-icons/tb";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { SiVirustotal } from "react-icons/si";
import { CiDiscount1 } from "react-icons/ci";
import ActionBar from "@/design-system/molecules/platform/ActionBar";
import Button from "@/design-system/atoms/Button";
import ListingSpecificationFields, { type ListingTemplate } from "@/design-system/molecules/platform/ListingSpecificationFields";

interface AddFarmProductFormProps {
  fermCode: string;
}

const AddFarmProductForm = ({
  fermCode,
}: AddFarmProductFormProps) => {
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [uploadVersion, setUploadVersion] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    saleUnit: "",
    retailPrice: "",
    DailyProductionCapacity: "",
    stock: "",
  });
  const { createProduct } = useCreateProduct();
  const [selectedTemplateCode, setSelectedTemplateCode] = useState("");
  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  const templates = useQuery({
    queryKey: ["product-templates", "all"],
    queryFn: () => request<ListingTemplate[]>("/AgriculturalProductTemplate"),
  });
  const selectedTemplate = templates.data?.find((template) => template.code === selectedTemplateCode);
  const saleUnit = form.saleUnit || selectedTemplate?.defaultSaleUnit || "";

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (createProduct.isPending) return;
    if (!selectedTemplate) {
      toast.error("نوع محصول را انتخاب کنید.");
      return;
    }
    if (
      !form.name.trim() ||
      !saleUnit ||
      !form.retailPrice ||
      !form.stock
    ) {
      toast.error("نام، واحد فروش، قیمت و موجودی را تکمیل کنید");
      return;
    }
    if (!imageFile.length) {
      toast.error("لطفاً یک تصویر انتخاب کنید.");
      return;
    }
    if (imageFile.some(file => file.size === 0 || !/\.(jpe?g|png|webp|gif)$/i.test(file.name))) {
      toast.error("تصویر باید سالم و با فرمت JPG، PNG، WebP یا GIF باشد.");
      return;
    }
    if (Number(form.stock) > 2147483647 || Number(form.DailyProductionCapacity) > 2147483647) {
      toast.error("موجودی و ظرفیت روزانه هرکدام حداکثر می‌توانند ۲٬۱۴۷٬۴۸۳٬۶۴۷ باشند.");
      return;
    }

    const payload = new FormData();

    if (selectedTemplate.specifications.some((field) => field.isRequired && !field.options.some(option => option.code === specifications[field.code]))) {
      toast.error("همه مشخصات اجباری نوع محصول را انتخاب کنید");
      return;
    }
    payload.append("FarmCode", fermCode);
    payload.append("Name", form.name.trim());
    payload.append("Description", form.description.trim());
    payload.append("RetailPrice", form.retailPrice.toString());
    payload.append("SaleUnit", saleUnit);
    payload.append("Stock", form.stock.toString());
    if (form.DailyProductionCapacity) {
      payload.append("DailyProductionCapacity", form.DailyProductionCapacity);
    }
    payload.append("ProductTemplateCode", selectedTemplate.code);
    let index = 0;
    selectedTemplate.specifications.forEach((specification) => {
      const optionCode = specifications[specification.code];
      if (!specification.options.some(option => option.code === optionCode)) return;
      payload.append(`Specifications[${index}].SpecificationCode`, specification.code);
      payload.append(`Specifications[${index}].OptionCode`, optionCode);
      index += 1;
    });
    imageFile.forEach(file => payload.append("Images", file));

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast.success("محصول با موفقیت ثبت شد");
        setForm({
          name: "",
          description: "",
          saleUnit: "",
          retailPrice: "",
          DailyProductionCapacity: "",
          stock: "",
        });
        setImageFile([]);
        setUploadVersion((v) => v + 1);
        setSelectedTemplateCode("");
        setSpecifications({});
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-4xl space-y-6 pb-24 md:pb-10"
    >
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">ثبت آگهی جدید</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          مشخصات محصول، قیمت هر واحد و تصاویر را تکمیل کنید. فیلدهای ستاره‌دار
          ضروری هستند.
        </p>
      </header>
      <fieldset
        disabled={createProduct.isPending}
        className="min-w-0 space-y-6"
      >
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-bold text-emerald-800">مشخصات محصول</h2>
          {templates.isLoading && <p role="status" className="text-sm text-slate-600">در حال دریافت نوع محصول…</p>}
          {templates.isError && <button type="button" onClick={() => void templates.refetch()} className="text-sm font-bold text-red-700">دریافت مشخصات ناموفق بود. تلاش دوباره</button>}
          {templates.isSuccess && !templates.data.length && <p className="text-sm text-slate-600">هنوز نوع محصول فعالی برای ثبت آگهی تعریف نشده است.</p>}
          <ListingSpecificationFields
            templates={templates.data ?? []}
            templateCode={selectedTemplateCode}
            values={specifications}
            onTemplateChange={code => { setSelectedTemplateCode(code); setSpecifications({}); }}
            onValueChange={(code, value) => setSpecifications(previous => ({ ...previous, [code]: value }))}
          />
          <div className="space-y-4">
            {" "}
            <TextField
              required
              maxLength={255}
              label="نام محصول *"
              placeholder="مثال: شاخه گل لاله"
              icon={
                <MdOutlineDriveFileRenameOutline
                  size={24}
                  className="text-slate-700"
                />
              }
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full"
            />
            <Textarea
              placeholder="توضیحات کامل محصول..."
              maxLength={1000}
              className="min-h-28"
              lable="توضیحات محصول"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              icon={<TbFileDescription size={24} className="text-slate-700" />}
            />
          </div>
        </section>
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-bold text-emerald-800">
            قیمت و موجودی
          </h2>
          <SaleUnitField
            value={saleUnit}
            onChange={(value) => updateField("saleUnit", value)}
          />
          <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
            {" "}
            <TextField
              required
              label="قیمت هر واحد (تومان) *"
              placeholder="مثال: 5600000"
              icon={<IoPricetagsOutline size={24} className="text-slate-700" />}
              inputMode="numeric"
              dir="ltr"
              value={formatAmount(form.retailPrice)}
              onChange={(e) =>
                updateField("retailPrice", amountDigits(e.target.value))
              }
              className="w-full"
            />
            <TextField
              required
              inputMode="numeric"
              label="موجودی *"
              placeholder="مثال: 700"
              icon={<SiVirustotal size={24} className="text-slate-700" />}
              value={form.stock}
              onChange={(e) =>
                updateField("stock", amountDigits(e.target.value))
              }
            />
            <div>
              <p className="mb-2 text-xs leading-6 text-slate-500">
                مقدار تقریبی تولید این محصول در یک روز را وارد کنید.
              </p>
              <TextField
                label="ظرفیت روزانه تولید محصول (اختیاری)"
                icon={<CiDiscount1 size={24} className="text-slate-700" />}
                placeholder="مثال: 50"
                value={form.DailyProductionCapacity}
                onChange={(e) =>
                  updateField(
                    "DailyProductionCapacity",
                    amountDigits(e.target.value),
                  )
                }
              />
            </div>
          </div>
        </section>
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-bold text-emerald-800">
            تصاویر محصول *
          </h2>
          <p className="text-sm leading-7 text-slate-500">
            حداقل یک تصویر واضح انتخاب کنید. هر تصویر حداکثر ۵ مگابایت.
          </p>
          <MultiImageUpload
            key={uploadVersion}
            value={imageFile}
            maxFiles={15}
            maxSize={5}
            disabled={createProduct.isPending}
            onChange={setImageFile}
          />
        </section>
      </fieldset>
      <ActionBar>
        <Button
          disabled={createProduct.isPending}
          type="button"
          onClick={handleSubmit}
        >
          {createProduct.isPending ? "در حال ثبت آگهی…" : "ثبت آگهی"}
        </Button>
      </ActionBar>
    </div>
  );
};
export default AddFarmProductForm;
