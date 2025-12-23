import { IApiResponse } from "./general";

export interface IAgriculturalProduct {
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
}
export interface IPaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreateProductPayload {
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

export type GetProductResponse = IApiResponse<
  IPaginatedResult<IAgriculturalProduct>
>;

