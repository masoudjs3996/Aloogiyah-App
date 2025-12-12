import { IApiResponse } from "./general";

export interface ICategoryFeatured {
  code: string;
  name: string;
  imageUrl: string;
  slug: string;
}

export interface ICategoryFeatured {
  code: string;
  name: string;
  imageUrl: string;
  slug: string;
}

export interface ICategoryTree extends ICategoryFeatured {
  parentCategoryCode: string | null;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  subCategories: ICategoryTree[];
}
export interface CategoryFeaturedResponse extends IApiResponse<ICategoryFeatured[]> {}
export interface CategoryTreeResponse extends IApiResponse<ICategoryTree[]> {}
