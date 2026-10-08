"use client";
import { useEffect, useState } from "react";
import { SelectBox } from "@/design-system/atoms/SelectBox";
import { MultiSelect } from "@/design-system/organisms/public";
import { ICategoryTree } from "@/shared/types/categories";
import { FaTrash, FaUpload } from "react-icons/fa";
import { TextField } from "@/design-system/molecules/public";
import { IoPricetagsOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import { useCreateProduct } from "@/hooks/mutations/useAddProduct";
import MultiImageUpload from "@/design-system/molecules/dashbord/MultiImageUploader";
import Textarea from "@/design-system/atoms/Textarea";
import { TbFileDescription } from "react-icons/tb";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { RiPriceTag2Line } from "react-icons/ri";
import { SiVirustotal } from "react-icons/si";
import { CiDiscount1 } from "react-icons/ci";
import { BiCategory } from "react-icons/bi";
import Button from "@/design-system/atoms/Button";

interface AddFarmProductFormProps {
  categories: ICategoryTree[];
  fermCode: string;
}

const AddFarmProductForm = ({
  fermCode,
  categories,
}: AddFarmProductFormProps) => {
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    retailPrice: "",
    wholesalePrice: "",
    DailyProductionCapacity: "",
    stock: "",
  });
  const { createProduct } = useCreateProduct();
  const [selectedParentCategory, setSelectedParentCategory] =
    useState<string>("");
  const [selectedCategoryCodes, setSelectedCategoryCodes] = useState<string[]>(
    [],
  );

  const parentCategory = categories.find(
    (c) => c.code === selectedParentCategory,
  );
  const childCategoryOptions =
    parentCategory?.subCategories?.map((child) => ({
      label: child.name,
      value: child.code,
    })) ?? [];

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(Array.isArray(file) ? file : [file]);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!imageFile.length) {
      toast.error("لطفا یک تصویر انتخاب کنید");
      return;
    }

    const payload = new FormData();

    const allCategoryCodes = [
      selectedParentCategory,
      ...selectedCategoryCodes,
    ].filter(Boolean);
    payload.append("FarmCode", fermCode);
    payload.append("Name", form.name.trim());
    payload.append("Description", form.description.trim());
    payload.append("RetailPrice", form.retailPrice.toString());
    payload.append("WholesalePrice", form.wholesalePrice.toString());
    payload.append("Stock", form.stock.toString());
    payload.append(
      "DailyProductionCapacity",
      form.DailyProductionCapacity.toString(),
    );
    allCategoryCodes.forEach((code) => {
      payload.append("CategoryCodes", code);
    });
    if (imageFile) {
      imageFile?.forEach((file) => {
        payload.append("Images", file);
      });
    }

    // payload.append("Images", imageFile);
    payload.append("MetaTitle", "");
    payload.append("MetaDescription", "");
    payload.append("MetaKeywords", "");
    payload.append("StatusCode", "251BC4A57D");
    payload.append("Slug", "");

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast.success("محصول با موفقیت ثبت شد");
        setForm({
          name: "",
          description: "",
          retailPrice: "",
          wholesalePrice: "",
          DailyProductionCapacity: "",
          stock: "",
        });
        setImageFile([]);
        setImagePreview(null);
        setImageFile([]);
        setSelectedParentCategory("");
        setSelectedCategoryCodes([]);
      },
      onError: (err: any) => {
        console.error("Error creating product:", err);
        toast.error("خطا در ثبت محصول");
      },
    });
  };


  return (
    <div className="p-5 space-y-5  mx-auto pb-20">
      <h1 className="text-center text-lg font-semibold">ثبت محصول جدید</h1>

      {/* IMAGE */}
      {/* <div className="rounded-2xl overflow-hidden shadow relative">
        {imagePreview ? (
          <img src={imagePreview} className="w-full object-cover max-h-40" />
        ) : (
          <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400">
            عکس محصول
          </div>
        )}
        <label className="absolute bottom-0 left-0 right-0 bg-black/40 text-white p-2 text-sm flex items-center justify-center gap-x-2 cursor-pointer">
          <FaUpload /> ویرایش عکس
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>
      </div> */}

      <div className="grid grid-cols-1  lg:grid-cols-3 gap-y-5 lg:gap-x-5">
        <MultiImageUpload
          value={imageFile}
          maxFiles={15}
          maxSize={5}
          className=""
          onChange={(file) => {
            if (file) {
              setImageFile(Array.isArray(file) ? file : [file]);
            }
            if (!file) {
              setImagePreview(null);
            }
          }}
        />

        {/* FORM FIELDS */}
        <div className="w-full gap-3 h-full flex flex-col">
          <TextField
            label="اسم محصول"
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
            className="min-h-28 flex-1 "
            lable="توضیحات محصول :"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            icon={<TbFileDescription size={24} className="text-slate-700" />}
          />
        </div>
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TextField
          label="قیمت خرده‌فروشی"
          placeholder="مثال: 5600000"
          icon={<IoPricetagsOutline size={24} className="text-slate-700" />}
          value={form.retailPrice}
          onChange={(e) => updateField("retailPrice", e.target.value)}
          className="w-full"
        />
        <TextField
          label="قیمت عمده"
          icon={<RiPriceTag2Line size={24} className="text-slate-700" />}
          placeholder="مثال: 4800000"
          value={form.wholesalePrice}
          onChange={(e) => updateField("wholesalePrice", e.target.value)}
          className="w-full"
        />
        <TextField
          label="موجودی"
          placeholder="مثال: 700"
          icon={<SiVirustotal size={24} className="text-slate-700" />}
          value={form.stock}
          onChange={(e) => updateField("stock", e.target.value)}
        />
        <TextField
          label="ظرفیت روزانه تولید محصول"
          icon={<CiDiscount1 size={24} className="text-slate-700" />}
          placeholder="مثال: 50"
          value={form.DailyProductionCapacity}
          onChange={(e) =>
            updateField("DailyProductionCapacity", e.target.value)
          }
        />
        <SelectBox
          label="دسته‌بندی اصلی"
          options={categories.map((c) => c.name)}
          icon={<BiCategory size={24} className="text-slate-700" />}
          value={
            categories.find((c) => c.code === selectedParentCategory)?.name ||
            ""
          }
          onChange={(name) => {
            const found = categories.find((c) => c.name === name);
            setSelectedParentCategory(found?.code ?? "");
            setSelectedCategoryCodes([]);
          }}
        />
        <SelectBox
          label="دسته‌بندی فرعی"
          options={childCategoryOptions.map((cat) => cat.label)}
          value={selectedCategoryCodes
            .map(
              (code) =>
                childCategoryOptions.find((c) => c.value === code)?.label || "",
            )
            .filter(Boolean)}
          onChange={(selected) => {
            if (Array.isArray(selected)) {
              const codes = selected
                .map(
                  (name) =>
                    childCategoryOptions.find((c) => c.label === name)?.value,
                )
                .filter(Boolean) as string[];
              setSelectedCategoryCodes(codes);
            }
          }}
          placeholder="دسته‌بندی‌ها را انتخاب کنید"
          multiple={true}
          icon={<BiCategory size={24} className="text-slate-700" />}
        />
        {/* <MultiSelect
          label="دسته‌بندی فرعی"
          options={childCategoryOptions}
          value={selectedCategoryCodes}
          onChange={setSelectedCategoryCodes}
        /> */}
      </div>
      <Button
        variant="secondary"
        className="w-full"
        type="submit"
        onClick={handleSubmit}
      >
        ثبت محصول
      </Button>
      {/* <button className="bg-green-600 text-white p-3 rounded-xl w-full mt-5">
        ثبت محصول
      </button>

      <button className="text-red-600 flex items-center justify-center gap-x-2 p-3 w-full border border-red-500 rounded-xl mt-3">
        <FaTrash /> حذف محصول
      </button> */}
    </div>
  );
};

export default AddFarmProductForm;
