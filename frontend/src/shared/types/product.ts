import { IApiResponse } from "./general";
import type { ProductOffer } from "./productOffer";

export interface IAgriculturalProduct extends ProductOffer {
  saleUnit?: string | null;
  code: string;
  name: string;
  description: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  greenhouseCode: string;
  slug: string;
  primaryImageUrl: string;
  createdAt: string;
  statusCode: string;
  isSellable?: boolean;
}
export interface IPaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreateProductPayload {
  saleUnit?: string | null;
  FarmCode: string;
  Name: string;
  Slug: string;
  Description: string;
  RetailPrice: number | string;
  WholesalePrice: number | string;
  Stock: number | string;
  DailyProductionCapacity?: number | string;
  CategoryCodes: string[];
  MetaTitle?: string;
  MetaDescription?: string;
  MetaKeywords?: string;
  StatusCode?: string;
  Images?: File[];
}
export interface ProductFilter {
  saleUnit?: string | null;
  discountedOnly?: boolean;
  name?: string;
  statusCode?: string;
  farmCode?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  categoryCodes?: string[];
  pageNumber?: number;
  pageSize?: number;
}

export type GetProductResponse = IApiResponse<IAgriculturalProduct[]>;
