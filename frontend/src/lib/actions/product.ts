import axiosInstance from "@/shared/lib/config/axions";
import {
  GetProductResponse,
  IAgriculturalProduct,
  IPaginatedResult,
} from "@/shared/types/product";
import axios from "axios";

export async function getProducts(
  payload?: any
): Promise<IPaginatedResult<IAgriculturalProduct> | null> {
  try {
    const { data } = await axiosInstance.get<GetProductResponse>(
      `/AgriculturalProduct/GetByFilter?FarmCode=${payload}`
    );
    return data?.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
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
    const {data} = await axiosInstance.get(
      "/AgriculturalProduct/GetByCode?code=7A52D575F8"
    );
    
    return data
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}
