import axiosInstance from "@/shared/lib/config/axions";
import {
  CategoryFeaturedResponse,
  CategoryTreeResponse,
} from "@/shared/types/categories";

export async function getFeaturedCategories(): Promise<CategoryFeaturedResponse | null> {
  try {
    const { data } = await axiosInstance.get<CategoryFeaturedResponse>(
      "/Category/GetCategoriesByType?type=Home"
    );
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);

    return null;
  }
}
export async function getCategoryTree(): Promise<CategoryTreeResponse | null> {
  try {
    const { data } = await axiosInstance.get<CategoryTreeResponse>(
      "/Category/CategoryTree"
    );
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return null;
  }
}
