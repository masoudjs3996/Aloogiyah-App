"use client";

import { useState } from "react";
import { FaTrash, FaUpload } from "react-icons/fa";

const AddProducts = () => {
  // ------------------------------
  // STATE
  // ------------------------------
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    retailPrice: "",
    wholesalePrice: "",
    stock: "",
    categoryCodes: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });

  // ------------------------------
  // IMAGE UPLOAD HANDLER
  // ------------------------------
  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  // ------------------------------
  // HANDLE INPUT CHANGE
  // ------------------------------
  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ------------------------------
  // SUBMIT (API READY)
  // ------------------------------
  const handleSubmit = () => {
    const payload = {
      name: form.name,
      description: form.description,
      retailPrice: Number(form.retailPrice),
      wholesalePrice: Number(form.wholesalePrice),
      stock: Number(form.stock),
      categoryCodes: form.categoryCodes.split(",").map((c) => c.trim()),
      slug: form.slug,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywords,
    };

    console.log("🚀 PAYLOAD TO SEND:", payload);
  };

  // ======================================================
  //
  //   ATOM COMPONENTS (در همین فایل — بعداً جدا کن)
  //
  // ======================================================

  const Label = ({ text }: { text: string }) => (
    <label className="text-sm text-gray-600 block mt-3">{text}</label>
  );

  const Input = ({
    value,
    onChange,
    placeholder,
  }: {
    value: any;
    onChange: any;
    placeholder?: string;
  }) => (
    <input
      className="w-full p-3 rounded-xl border text-right mt-1"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  const TextArea = ({
    value,
    onChange,
    placeholder,
  }: {
    value: any;
    onChange: any;
    placeholder?: string;
  }) => (
    <textarea
      className="w-full p-3 rounded-xl border text-right mt-1 h-24"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  // ======================================================
  //
  //   ORGANISM: WHOLE FORM UI
  //
  // ======================================================

  return (
    <div className="p-5 space-y-5 max-w-md mx-auto pb-20">
      <h1 className="text-center text-lg font-semibold">ثبت محصول جدید</h1>

      {/* IMAGE UPLOADER */}
      <div className="rounded-2xl overflow-hidden shadow relative">
        {imagePreview ? (
          <img src={imagePreview} className="w-full object-cover" />
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

      {/* ▬▬▬ FORM FIELDS ▬▬▬ */}

      <Label text="اسم محصول" />
      <Input
        value={form.name}
        onChange={(v) => updateField("name", v)}
        placeholder="مثال: شاخه گل لاله"
      />

      <Label text="توضیحات محصول" />
      <TextArea
        value={form.description}
        onChange={(v) => updateField("description", v)}
        placeholder="توضیح کامل محصول..."
      />

      <Label text="قیمت محصول (خرده‌فروشی)" />
      <Input
        value={form.retailPrice}
        onChange={(v) => updateField("retailPrice", v)}
        placeholder="مثال: 5600000"
      />

      <Label text="قیمت عمده" />
      <Input
        value={form.wholesalePrice}
        onChange={(v) => updateField("wholesalePrice", v)}
        placeholder="مثال: 4800000"
      />

      <Label text="موجودی (عدد)" />
      <Input
        value={form.stock}
        onChange={(v) => updateField("stock", v)}
        placeholder="مثال: 700"
      />

      <Label text="دسته‌بندی‌ها (کدها با کاما جدا)" />
      <Input
        value={form.categoryCodes}
        onChange={(v) => updateField("categoryCodes", v)}
        placeholder="مثال: rose, flower, red"
      />

      <Label text="اسلاگ (slug)" />
      <Input
        value={form.slug}
        onChange={(v) => updateField("slug", v)}
        placeholder="مثال: red-tulip-branch"
      />

      <Label text="Meta Title" />
      <Input
        value={form.metaTitle}
        onChange={(v) => updateField("metaTitle", v)}
      />

      <Label text="Meta Description" />
      <TextArea
        value={form.metaDescription}
        onChange={(v) => updateField("metaDescription", v)}
      />

      <Label text="Meta Keywords" />
      <Input
        value={form.metaKeywords}
        onChange={(v) => updateField("metaKeywords", v)}
        placeholder="مثال: گل, لاله, شاخه گل"
      />

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white p-3 rounded-xl w-full mt-5"
      >
        ثبت محصول
      </button>

      {/* DELETE EXAMPLE */}
      <button className="text-red-600 flex items-center justify-center gap-x-2 p-3 w-full border border-red-500 rounded-xl mt-3">
        <FaTrash />
        حذف محصول به‌طور کامل
      </button>
    </div>
  );
};

export default AddProducts;
