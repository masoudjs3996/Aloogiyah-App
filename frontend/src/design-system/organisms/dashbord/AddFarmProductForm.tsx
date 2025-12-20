"use client";
import { useState } from "react";
import { SelectBox } from "@/design-system/atoms/SelectBox";
import { MultiSelect } from "@/design-system/organisms/public";
import { ICategoryTree } from "@/shared/types/categories";
import { FaTrash, FaUpload } from "react-icons/fa";
import { TextField } from "@/design-system/molecules/public";

import toast from "react-hot-toast";
import { useCreateProduct } from "@/hooks/mutations/useAddProduct";

interface AddFarmProductFormProps {
  categories: ICategoryTree[];
  fermCode: string;
}

const AddFarmProductForm = ({
  fermCode,
  categories,
}: AddFarmProductFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
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
    []
  );

  const parentCategory = categories.find(
    (c) => c.code === selectedParentCategory
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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error("لطفا یک تصویر انتخاب کنید");
      return;
    }

    const payload = new FormData();

    const allCategoryCodes = [
      selectedParentCategory,
      ...selectedCategoryCodes,
    ].filter(Boolean);
    payload.append("FarmCode", fermCode);
    payload.append("Name", "گل");
    payload.append("Description", form.description.trim());
    payload.append("RetailPrice", form.retailPrice.toString());
    payload.append("WholesalePrice", form.wholesalePrice.toString());
    payload.append("Stock", form.stock.toString());
    payload.append(
      "DailyProductionCapacity",
      form.DailyProductionCapacity.toString()
    );
    allCategoryCodes.forEach((code) => {
      payload.append("CategoryCodes", code);
    });
    payload.append("Images", imageFile);
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
        setImageFile(null);
        setImagePreview(null);
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
    <div className="p-5 space-y-5 max-w-md mx-auto pb-20">
      <h1 className="text-center text-lg font-semibold">ثبت محصول جدید</h1>

      {/* IMAGE */}
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
          <input type="file" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      {/* FORM FIELDS */}
      <TextField
        label="اسم محصول"
        placeholder="مثال: شاخه گل لاله"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
      />
      <TextField
        label="توضیحات محصول"
        placeholder="توضیح کامل محصول..."
        value={form.description}
        onChange={(e) => updateField("description", e.target.value)}
      />
      <TextField
        label="قیمت خرده‌فروشی"
        placeholder="مثال: 5600000"
        value={form.retailPrice}
        onChange={(e) => updateField("retailPrice", e.target.value)}
      />
      <TextField
        label="قیمت عمده"
        placeholder="مثال: 4800000"
        value={form.wholesalePrice}
        onChange={(e) => updateField("wholesalePrice", e.target.value)}
      />
      <TextField
        label="موجودی"
        placeholder="مثال: 700"
        value={form.stock}
        onChange={(e) => updateField("stock", e.target.value)}
      />
      <TextField
        label="ظرفیت روزانه تولید محصول"
        placeholder="مثال: 50"
        value={form.DailyProductionCapacity}
        onChange={(e) => updateField("DailyProductionCapacity", e.target.value)}
      />

      <SelectBox
        label="دسته‌بندی اصلی"
        options={categories.map((c) => c.name)}
        value={
          categories.find((c) => c.code === selectedParentCategory)?.name || ""
        }
        onChange={(name) => {
          const found = categories.find((c) => c.name === name);
          setSelectedParentCategory(found?.code ?? "");
          setSelectedCategoryCodes([]);
        }}
      />

      <MultiSelect
        label="دسته‌بندی فرعی"
        options={childCategoryOptions}
        value={selectedCategoryCodes}
        onChange={setSelectedCategoryCodes}
      />

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white p-3 rounded-xl w-full mt-5"
      >
        ثبت محصول
      </button>

      <button className="text-red-600 flex items-center justify-center gap-x-2 p-3 w-full border border-red-500 rounded-xl mt-3">
        <FaTrash /> حذف محصول
      </button>
    </div>
  );
};

export default AddFarmProductForm;
