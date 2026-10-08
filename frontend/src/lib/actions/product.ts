import axiosInstance from "@/shared/lib/config/axions";
import {
  GetProductResponse,
  IAgriculturalProduct,
  ProductFilter,
} from "@/shared/types/product";

export async function getProducts(
  filters?: ProductFilter,
): Promise<IAgriculturalProduct[] | null> {
  try {
    const params = new URLSearchParams();
    if (!filters) {
    } else {
      if (filters.name) params.append("Name", filters.name);
      if (filters.statusCode) params.append("StatusCode", filters.statusCode);
      if (filters.farmCode) params.append("FarmCode", filters.farmCode);
      if (filters.minPrice !== undefined)
        params.append("MinPrice", filters.minPrice.toString());
      if (filters.maxPrice !== undefined)
        params.append("MaxPrice", filters.maxPrice.toString());
      if (filters.minStock !== undefined)
        params.append("MinStock", filters.minStock.toString());
      if (filters.maxStock !== undefined)
        params.append("MaxStock", filters.maxStock.toString());
      const validCategoryCodes =
        filters.categoryCodes?.filter(
          (code) => code !== undefined && code !== null && code !== "",
        ) ?? [];

      if (validCategoryCodes.length > 0) {
        validCategoryCodes.forEach((code) => {
          params.append("CategoryCodes", code);
        });
      }

      params.append("PageNumber", (filters.pageNumber ?? 1).toString());
      params.append("PageSize", (filters.pageSize ?? 3).toString());
    }

    const url = `/AgriculturalProduct/GetByFilter?${params.toString()}`;

    const { data } = await axiosInstance.get<GetProductResponse>(url);

    if (!data?.isSuccess) {
      console.warn("API returned unsuccessful response:", data?.message);
      return null;
    }

    return data.data ?? [];
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return null;
  }
}

export async function AddProduct(payload: FormData) {
  try {
    const res = await axiosInstance.post(
      "/AgriculturalProduct/CreateWithImages",
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res?.data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function GetDetailProduct(payload?: string) {
  try {
    const { data } = await axiosInstance.get(
      `/AgriculturalProduct/GetByCode?code=${payload}`,
    );

    return data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function GetSimilar(payload?: {
  ProductCode: string;
  PageNumber: number;
  PageSize: number;
  SortColumn: string;
  SortDescending: boolean;
}) {
  try {
    const { data } = await axiosInstance.get(
      `/AgriculturalProduct/GetSimilar`,
      {
        params: {
          ProductCode: payload?.ProductCode,
          PageNumber: payload?.PageNumber,
          PageSize: payload?.PageSize,
          SortColumn: payload?.SortColumn,
          SortDescending: payload?.SortDescending,
        },
      },
    );

    return data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}
