import { Pagination } from "../design-system/molecules/Pagination";
import {
  categoryFilterCodes,
  categoryOptions,
  productSortOptions,
} from "../shared/utils/product-filters";
import { Select } from "../design-system/molecules/Select";
import SpecificationMark from "../design-system/molecules/SpecificationMark";
import { amountDigits, formatAmount } from "../shared/utils/amount";
import { RegistrationHeading } from "../design-system/molecules/RegistrationSection";
import { appAlert as Alert } from "../shared/alerts";
import {
  saleUnits,
  saleUnitGuide,
  saleUnitLabel,
} from "../shared/utils/sale-units";
import React, { useState, useEffect, useRef } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/mobile";
import { platformApi, request } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Card } from "../design-system/atoms/Card";
import { Field } from "../design-system/atoms/Field";
import { Button } from "../design-system/atoms/Button";
import { QueryState } from "../design-system/molecules/QueryState";
import { AuthGate } from "../design-system/organisms/AuthGate";
import {
  appendImage,
  ImageUpload,
} from "../design-system/organisms/ImageUpload";
import { ManagementPhoto } from "../design-system/molecules/ManagementPhoto";
import { ProductPrices } from "../design-system/molecules/ProductPrices";
import { useAuth } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { useListSearch } from "../shared/hooks/useListSearch";
import { imageUrl, number, quantity } from "../shared/utils/format";
import { theme } from "../shared/theme";
import type { PickedImage, Product } from "../shared/types/mobile";
import type { Props } from "../navigation/types";

function productImage(p?: Product) {
  const src = p?.primaryImageUrl || p?.imageUrl;
  return src === "/images/default-product.jpg" ? undefined : src;
}

function FarmProductCard({
  product,
  list,
  columns,
  onEdit,
}: {
  product: Product;
  list: boolean;
  columns: boolean;
  onEdit: () => void;
}) {
  const active = product.isSellable ?? product.statusCode === "251BC4A57D";
  return (
    <Card
      style={{
        width: columns ? "49%" : "100%",
        padding: 12,
        flexDirection: list ? "row-reverse" : "column",
        alignItems: list ? "center" : "stretch",
      }}
    >
      <View style={{ width: list ? 76 : "100%" }}>
        <ManagementPhoto
          uri={imageUrl(productImage(product))}
          label={`تصویر محصول ${product.name}`}
          style={{ height: list ? 80 : 180, borderRadius: 12 }}
        />
        {!list && (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              borderRadius: 24,
              paddingHorizontal: 10,
              paddingVertical: 2,
              backgroundColor: theme.white,
            }}
          >
            <Text
              bold
              style={{
                color: active ? theme.green : theme.muted,
                fontSize: 11,
              }}
            >
              {active ? "فعال" : "غیرقابل فروش"}
            </Text>
          </View>
        )}
      </View>
      <View style={list ? { flex: 1, minWidth: 0 } : undefined}>
        <Text bold numberOfLines={2} style={{ fontSize: 17 }}>
          {product.name}
        </Text>
        <Text muted style={{ fontSize: 12 }}>
          موجودی: {number(product.stock)} {saleUnitLabel(product.saleUnit)}
        </Text>
        <ProductPrices product={product} compact />
      </View>
      {list ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`ویرایش ${product.name}`}
          onPress={onEdit}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: theme.mint,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="pencil-outline" size={18} color={theme.green} />
        </Pressable>
      ) : (
        <Button
          compact
          outline
          title="ویرایش آگهی"
          icon={
            <Ionicons name="pencil-outline" size={16} color={theme.green} />
          }
          onPress={onEdit}
        />
      )}
    </Card>
  );
}

export function FarmProductsScreen({
  route,
  navigation,
}: Props<"FarmProducts">) {
  const { page, setPage, search, name, setSearch } = useListSearch();
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [list, setList] = useState(false);
  const { width } = useWindowDimensions();
  const signedIn = useAuth().signedIn;
  const categories = useQuery({
    queryKey: ["category-tree"],
    queryFn: platformApi.categoryTree,
    enabled: signedIn,
  });
  const categoryCodes = categoryFilterCodes(categories.data || [], category);
  const farm = route.params.farm;
  const q = useQuery({
    queryKey: ["farm-products", farm, name, categoryCodes, sort, page],
    queryFn: ({ signal }) =>
      api.products(
        {
          FarmCode: farm,
          Name: name || undefined,
          CategoryCodes: categoryCodes,
          SortColumn: sort ? "price" : undefined,
          SortDescending: sort !== "price:asc",
          PageNumber: page,
          PageSize: 8,
        },
        signal,
      ),
    enabled: signedIn,
  });
  return (
    <AuthGate>
      <Screen>
        <Button
          title="افزودن آگهی جدید"
          icon={<Ionicons name="add" size={19} color={theme.white} />}
          onPress={() => navigation.navigate("ProductForm", { farm })}
        />
        <View style={{ marginTop: 16 }}>
          <Field
            label="جست‌وجوی آگهی"
            placeholder="جست‌وجو در آگهی‌ها…"
            icon={<Ionicons name="search" size={19} color={theme.muted} />}
            value={search}
            onChangeText={setSearch}
          />
          <View style={{ flexDirection: "row-reverse", gap: 8 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Select
                label="دسته‌بندی"
                value={category}
                options={[
                  { value: "", label: "همه دسته‌ها" },
                  ...categoryOptions(categories.data || []),
                ]}
                onChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Select
                label="مرتب‌سازی"
                value={sort}
                options={productSortOptions.slice(0, 3)}
                onChange={(value) => {
                  setSort(value);
                  setPage(1);
                }}
              />
            </View>
          </View>
          <View
            style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 12 }}
          >
            {(
              [
                { value: false, label: "نمای کارت‌ها", icon: "grid-outline" },
                { value: true, label: "نمای فهرست", icon: "list-outline" },
              ] as const
            ).map(({ value, label, icon }) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: list === value }}
                onPress={() => setList(value)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: list === value ? theme.mint : theme.white,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={icon}
                  size={20}
                  color={list === value ? theme.green : theme.muted}
                />
              </Pressable>
            ))}
          </View>
        </View>
        <QueryState
          loading={q.isLoading}
          error={q.error}
          empty={q.data?.items.length === 0}
          emptyText="محصولی پیدا نشد"
          retry={() => q.refetch()}
        />
        <View
          style={{
            flexDirection: "row-reverse",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {q.data?.items.map((p) => (
            <FarmProductCard
              key={p.code}
              product={p}
              list={list}
              columns={!list && width >= 640}
              onEdit={() =>
                navigation.navigate("ProductForm", { farm, code: p.code })
              }
            />
          ))}
        </View>
        <Pagination
          page={page}
          pageSize={q.data?.pageSize || 8}
          totalCount={q.data?.totalCount || 0}
          busy={q.isFetching}
          onChange={setPage}
        />
      </Screen>
    </AuthGate>
  );
}
export function ProductFormScreen({ route, navigation }: Props<"ProductForm">) {
  const { farm, code } = route.params;
  const signedIn = useAuth().signedIn;
  const q = useQuery({
    queryKey: ["product", code],
    queryFn: () => api.product(code!),
    enabled: !!code && signedIn,
  });
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [retail, setRetail] = useState("");
  const [saleUnitOverride, setSaleUnit] = useState("");
  const [stock, setStock] = useState("");
  const [capacity, setCapacity] = useState("");
  const productTemplates = useQuery({
    queryKey: ["product-templates", "all"],
    queryFn: () => platformApi.productTemplates(),
  });
  const [productTemplateCode, setProductTemplateCode] = useState("");
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  const selectedTemplate = productTemplates.data?.find((template) => template.code === productTemplateCode);
  const saleUnit = saleUnitOverride || selectedTemplate?.defaultSaleUnit || "";
  const [images, setImages] = useState<PickedImage[]>([]);
  const { busy, run } = useAction();
  const initialized = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (q.data && initialized.current !== code) {
      initialized.current = code;
      const p = q.data;
      setName(p.name);
      setDesc(p.description);
      setRetail(String(p.retailPrice));
      setSaleUnit(p.saleUnit ?? "");
      setStock(String(p.stock));
      setCapacity(
        p.dailyProductionCapacity == null
          ? ""
          : String(p.dailyProductionCapacity),
      );
      setProductTemplateCode(p.productTemplateCode || "");
      setSpecifications(Object.fromEntries((p.specifications || []).map((specification) => [specification.specificationCode, specification.optionCode])));
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
          title={code ? "ویرایش آگهی" : "ثبت آگهی جدید"}
          description="مشخصات محصول، قیمت هر واحد و تصاویر را تکمیل کنید. فیلدهای ستاره‌دار ضروری هستند."
        />
        <Card>
          <QueryState
            loading={!!code && q.isLoading}
            error={q.error}
            retry={() => q.refetch()}
          />
          <RegistrationHeading title="مشخصات محصول" />
          <QueryState
            loading={productTemplates.isLoading}
            error={productTemplates.error}
            empty={productTemplates.data?.length === 0}
            emptyText="هنوز نوع محصول فعالی برای ثبت آگهی تعریف نشده است."
            retry={() => productTemplates.refetch()}
          />
          {!!productTemplates.data?.length && <>
            <RegistrationHeading title="نوع و مشخصات آگهی" description="گزینه‌های ستاره‌دار را انتخاب کنید. این مشخصات در آگهی نمایش داده می‌شوند." />
            <Select
              required
              label="نوع محصول"
              value={productTemplateCode}
              error={submitted && !selectedTemplate ? "نوع محصول را انتخاب کنید." : undefined}
              disabled={productTemplates.isLoading || !!productTemplates.error}
              options={productTemplates.data.map(template => ({
                value: template.code,
                label: `${template.name} · ${template.categoryName}`,
              }))}
              onChange={(value) => { setProductTemplateCode(value); setSpecifications({}); }}
            />
            {selectedTemplate && <Text muted style={{ marginBottom: 12 }}>دسته‌بندی آگهی · {selectedTemplate.categoryName}</Text>}
            {selectedTemplate?.specifications.map((specification) => {
              const value = specification.options.some(option => option.code === specifications[specification.code])
                ? specifications[specification.code] : "";
              const options = specification.options.map(option => ({
                value: option.code, label: option.label,
                leading: option.colorHex || option.icon ? <SpecificationMark {...option} /> : undefined,
              }));
              return <Select
                key={specification.code}
                required={specification.isRequired}
                label={specification.isRequired ? specification.name : `${specification.name} (اختیاری)`}
                value={value}
                options={specification.isRequired ? options : [{ value: "", label: "بدون انتخاب" }, ...options]}
                error={submitted && specification.isRequired && !value ? "یک گزینه را انتخاب کنید." : undefined}
                onChange={option => setSpecifications(previous => ({ ...previous, [specification.code]: option }))}
              />;
            })}
          </>}
          <Field
            required
            placeholder="مثلاً گل رز قرمز درجه یک"
            label="نام آگهی"
            error={
              submitted && !name.trim() ? "نام محصول را وارد کنید" : undefined
            }
            value={name}
            onChangeText={setName}
          />
          <Field
            label="توضیحات"
            style={{ minHeight: 112, textAlignVertical: "top" }}
            multiline
            value={desc}
            onChangeText={setDesc}
            maxLength={1000}
          />
        </Card>
        <Card>
          <RegistrationHeading
            title="قیمت و موجودی"
            description="قیمت را به تومان وارد کنید."
          />
          <Select
            required
            label="واحد فروش محصول"
            value={saleUnit}
            onChange={setSaleUnit}
            options={[{ value: "", label: "انتخاب واحد فروش" }, ...saleUnits]}
          />
          <Text muted>{saleUnitGuide}</Text>
          {submitted && !saleUnit && (
            <Text style={{ color: "#EF4444" }}>واحد فروش را انتخاب کنید.</Text>
          )}
          <Field
            required
            error={
              submitted &&
              (!retail.trim() ||
                !Number.isFinite(quantity(retail)) ||
                quantity(retail) < 0)
                ? "قیمت معتبر را به تومان وارد کنید"
                : undefined
            }
            label={`قیمت هر ${saleUnitLabel(saleUnit)} (تومان)`}
            value={formatAmount(retail)}
            onChangeText={(text) => setRetail(amountDigits(text))}
            keyboardType="numeric"
          />
          <Field
            required
            error={
              submitted &&
              (!stock.trim() ||
                !Number.isInteger(quantity(stock)) ||
                quantity(stock) < 0)
                ? "موجودی را به صورت عدد کامل وارد کنید"
                : undefined
            }
            label={`موجودی (${saleUnitLabel(saleUnit)})`}
            value={stock}
            onChangeText={(text) => setStock(amountDigits(text))}
            keyboardType="number-pad"
          />
          <Field
            label={`ظرفیت تولید روزانه (${saleUnitLabel(saleUnit)}، اختیاری)`}
            hint="مقدار تقریبی تولید در یک روز"
            value={capacity}
            onChangeText={(text) => setCapacity(amountDigits(text))}
            keyboardType="number-pad"
          />
        </Card>
        <Card>
          <RegistrationHeading
            title="تصاویر محصول"
            description={
              code
                ? "تصاویر جدید به تصاویر قبلی اضافه می‌شوند."
                : "حداقل یک تصویر واضح از محصول انتخاب کنید."
            }
          />
          <ImageUpload
            multiple
            existingUrls={
              q.data?.imageUrls?.length
                ? q.data.imageUrls
                : [productImage(q.data) || ""]
            }
            files={images}
            onChange={setImages}
          />
        </Card>
        <Card>
          <Text muted>پس از بررسی اطلاعات، تغییرات را ذخیره کنید.</Text>
          <Button
            busy={busy}
            disabled={!!code && !q.data}
            title={code ? "ذخیره تغییرات آگهی" : "ثبت آگهی"}
            onPress={() =>
              run(async () => {
                setSubmitted(true);
                if (!selectedTemplate)
                  throw new Error("نوع محصول را انتخاب کنید.");
                if (!code && !images.length)
                  throw new Error("حداقل یک تصویر محصول انتخاب کنید");
                if (
                  !name.trim() ||
                  !saleUnit ||
                  !retail.trim() ||
                  !stock.trim() ||
                  !Number.isFinite(quantity(retail)) ||
                  quantity(retail) < 0 ||
                  !Number.isInteger(quantity(stock)) ||
                  quantity(stock) < 0
                )
                  throw new Error("نام، واحد فروش، قیمت و موجودی معتبر الزامی است");
                if (selectedTemplate?.specifications.some(field => field.isRequired && !field.options.some(option => option.code === specifications[field.code])))
                  throw new Error("همه مشخصات اجباری نوع محصول را انتخاب کنید");
                const specificationValues = selectedTemplate?.specifications.flatMap((specification) => {
                  const optionCode = specifications[specification.code];
                  return specification.options.some(option => option.code === optionCode)
                    ? [{ specificationCode: specification.code, optionCode }] : [];
                }) || [];
                const data = {
                  name: name.trim(),
                  description: desc,
                  retailPrice: quantity(retail),
                  saleUnit,
                  stock: quantity(stock),
                  dailyProductionCapacity: capacity
                    ? quantity(capacity)
                    : undefined,
                  productTemplateCode: selectedTemplate.code,
                  specifications: specificationValues,
                  slug: q.data?.slug || name.replace(/\s+/g, "-"),
                  metaTitle: name,
                  metaDescription: desc.slice(0, 150),
                };
                if (code) {
                  await api.updateProduct({
                    ...data,
                    code,
                    greenhouseCode: farm,
                  });
                  if (images.length) {
                    const body = new FormData();
                    images.forEach((p) => appendImage(body, "files", p));
                    await request("/AgriculturalListing/AddImages", {
                      method: "POST",
                      params: { productCode: code },
                      data: body,
                    });
                  }
                } else {
                  const body = new FormData();
                  body.append("FarmCode", farm);
                  const { specifications: values, ...formValues } = data;
                  Object.entries(formValues).forEach(([k, v]) => {
                    if (Array.isArray(v)) v.forEach((x) => body.append(k, x));
                    else if (v !== undefined) body.append(k, String(v));
                  });
                  values.forEach((value, index) => {
                    body.append(`Specifications[${index}].SpecificationCode`, value.specificationCode);
                    body.append(`Specifications[${index}].OptionCode`, value.optionCode);
                  });
                  images.forEach((p) => appendImage(body, "Images", p));
                  await api.createProduct(body);
                }
                navigation.goBack();
              }, "محصول ذخیره شد")
            }
          />
          {code && (
            <Button
              outline
              disabled={busy}
              title="حذف محصول"
              onPress={() =>
                Alert.alert("حذف محصول", "این محصول حذف شود؟", [
                  { text: "انصراف", style: "cancel" },
                  {
                    text: "حذف",
                    style: "destructive",
                    onPress: () =>
                      run(async () => {
                        await api.deleteProduct(code);
                        navigation.goBack();
                      }),
                  },
                ])
              }
            />
          )}
        </Card>
      </Screen>
    </AuthGate>
  );
}
