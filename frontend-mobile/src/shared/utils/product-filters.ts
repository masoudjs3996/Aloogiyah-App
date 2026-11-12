export type ProductFilters = {
  category: string;
  provinceCode: string;
  countyCode: string;
  localityCode: string;
  templateCode: string;
  specificationOptions: Record<string, string>;
  minPrice: string;
  maxPrice: string;
  sort: string;
  stockOnly: boolean;
  discountedOnly: boolean;
};

export const emptyProductFilters: ProductFilters = {
  category: "",
  provinceCode: "",
  countyCode: "",
  localityCode: "",
  templateCode: "",
  specificationOptions: {},
  minPrice: "",
  maxPrice: "",
  sort: "",
  stockOnly: false,
  discountedOnly: false,
};

export const productSortOptions = [
  { value: "", label: "تازه‌ترین" },
  { value: "price:asc", label: "ارزان‌ترین" },
  { value: "price:desc", label: "گران‌ترین" },
  { value: "stock:desc", label: "بیشترین موجودی" },
  { value: "name:asc", label: "نام آگهی" },
];

export function priceValue(value: string): number | undefined {
  const normalized = value
    .trim()
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[,٬]/g, "")
    .replace(/٫/g, ".");
  if (!normalized) return undefined;
  return /^\d+(\.\d{1,2})?$/.test(normalized) &&
    Number.isFinite(Number(normalized)) &&
    Number(normalized) <= Number.MAX_SAFE_INTEGER
    ? Number(normalized)
    : NaN;
}

export function validateProductFilters(value: ProductFilters): string {
  const min = priceValue(value.minPrice);
  const max = priceValue(value.maxPrice);
  if (Number.isNaN(min) || Number.isNaN(max))
    return "قیمت را به‌صورت عدد مثبت یا صفر وارد کنید.";
  if (min !== undefined && max !== undefined && min > max)
    return "حداکثر قیمت باید بیشتر یا برابر حداقل قیمت باشد.";
  return "";
}

export function productFilterParams(value: ProductFilters) {
  return {
    ProductTemplateCode: value.templateCode || undefined,
    ProvinceCode: value.provinceCode || undefined,
    CountyCode: value.countyCode || undefined,
    LocalityCode: value.localityCode || undefined,
    SpecificationOptionCodes: Object.values(value.specificationOptions).filter(Boolean),
    MinPrice: priceValue(value.minPrice),
    MaxPrice: priceValue(value.maxPrice),
    MinStock: value.stockOnly ? 1 : undefined,
    DiscountedOnly: value.discountedOnly || undefined,
    SortColumn: value.sort ? value.sort.split(":")[0] : undefined,
    SortDescending: !value.sort || value.sort.endsWith(":desc"),
  };
}

export function productFilterCount(value: ProductFilters): number {
  return [
    !!value.category,
    !!(value.provinceCode || value.countyCode || value.localityCode),
    !!value.templateCode,
    ...Object.values(value.specificationOptions),
    !!(value.minPrice.trim() || value.maxPrice.trim()),
    !!value.sort,
    value.stockOnly,
    value.discountedOnly,
  ].filter(Boolean).length;
}

type Category = { code: string; name: string; subCategories?: Category[] };

export function categoryOptions(
  nodes: Category[],
  prefix = "",
): { value: string; label: string }[] {
  return nodes.flatMap((node) => {
    const label = prefix ? prefix + " / " + node.name : node.name;
    return [
      { value: node.code, label },
      ...categoryOptions(node.subCategories ?? [], label),
    ];
  });
}

export function categoryFilterCodes(
  nodes: Category[],
  code: string,
): string[] | undefined {
  if (!code) return undefined;
  const find = (items: Category[]): Category | undefined => {
    for (const node of items) {
      if (node.code === code) return node;
      const child = find(node.subCategories ?? []);
      if (child) return child;
    }
  };
  const collect = (node: Category): string[] => [
    node.code,
    ...(node.subCategories ?? []).flatMap(collect),
  ];
  const selected = find(nodes);
  return selected ? collect(selected) : [code];
}
