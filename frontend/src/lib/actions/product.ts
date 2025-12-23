import axiosInstance from "@/shared/lib/config/axions";
import {
  GetProductResponse,
  IAgriculturalProduct,
  IPaginatedResult,
} from "@/shared/types/product";

export async function getProducts(
  payload?: string | null
): Promise<IPaginatedResult<IAgriculturalProduct> | null> {
  try {
    const url = payload
      ? `/AgriculturalProduct/GetByFilter?FarmCode=${encodeURIComponent(payload)}`
      : `/AgriculturalProduct/GetByFilter`;

    const { data } = await axiosInstance.get<GetProductResponse>(url);
    if (!data?.isSuccess) {
      console.warn("API returned unsuccessful response:", data?.message);
      return null;
    }

    return data.data ?? null;
  } catch (error: any) {
    console.error("Error fetching products:", error.message || error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    return null;
  }
}
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

export async function GetDetailProduct(payload: string) {
  try {
    const { data } = await axiosInstance.get(
      "/AgriculturalProduct/GetByCode?code=7A52D575F8"
    );

    return data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}
