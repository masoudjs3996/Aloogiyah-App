import axiosInstance from "@/shared/lib/config/axions";
import {
  GetProductResponse,
  IAgriculturalProduct,
  IPaginatedResult,
  ProductFilter,
} from "@/shared/types/product";

export async function getProducts(
  filters?: ProductFilter
): Promise<IPaginatedResult<IAgriculturalProduct> | null> {
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

      if (filters.categoryCodes?.length) {
        filters.categoryCodes.forEach((code) =>
          params.append("CategoryCodes", code)
        );
      }

      params.append("PageNumber", (filters.pageNumber ?? 1).toString());
      params.append("PageSize", (filters.pageSize ?? 50).toString());
    }

    const url = `/AgriculturalProduct/GetByFilter?${params.toString()}`;

    const { data } = await axiosInstance.get<GetProductResponse>(url);

    if (!data?.isSuccess) {
      console.warn("API returned unsuccessful response:", data?.message);
      return null;
    }

    return data.data ?? null;
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return null;
  }
}

// export async function getProducts(
//   payload?: ProductFilter
// ): Promise<IPaginatedResult<IAgriculturalProduct> | null> {
//   try {
//     const url = payload
//       ? `/AgriculturalProduct/GetByFilter?FarmCode=${encodeURIComponent(
//           payload
//         )}`
//       : `/AgriculturalProduct/GetByFilter`;

//     const { data } = await axiosInstance.get<GetProductResponse>(url);
//     if (!data?.isSuccess) {
//       console.warn("API returned unsuccessful response:", data?.message);
//       return null;
//     }

//     return data.data ?? null;
//   } catch (error: any) {
//     console.error("Error fetching products:", error.message || error);
//     if (error.response) {
//       console.error("Status:", error.response.status);
//       console.error("Response data:", error.response.data);
//     }

//     return null;
//   }
// }
export async function AddProduct(payload: FormData) {
  console.log("FormData payload:");
  for (const [key, value] of payload.entries()) {
    console.log(key, value);
  }
  try {
    const { data } = await axiosInstance.post(
      "/AgriculturalProduct/CreateWithImages",
      payload
    );

    return data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function GetDetailProduct(payload?: string) {
  try {
    const { data } = await axiosInstance.get(
      `/AgriculturalProduct/GetByCode?code=${payload}`
    );

    return data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}
