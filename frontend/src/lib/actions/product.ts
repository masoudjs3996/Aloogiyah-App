import axiosInstance from "@/shared/lib/config/axions";
import {
  GetProductResponse,
  IAgriculturalProduct,
  IPaginatedResult,
} from "@/shared/types/product";

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

export async function AddProduct() {
  const payload = new FormData();

  // هاردکد مثل curl
  payload.append("FarmCode", "79A05E6A91");
  payload.append("RetailPrice", "20000000000000");
  payload.append("WholesalePrice", "1000000000");

  // CategoryCodes چندتا کلید جدا
  payload.append("CategoryCodes", "DD5292100E");
  payload.append("CategoryCodes", "1B080E5790");

  payload.append("Name", "گل");
  payload.append("Slug", "");
  payload.append("DailyProductionCapacity", "10");
  payload.append("MetaKeywords", "");
  payload.append("MetaTitle", "");
  payload.append("Stock", "20");
  payload.append("MetaDescription", "");
  payload.append("StatusCode", "251BC4A57D");

  // تصویر از لوکال، مثل curl
  // توجه: این فایل باید از input type=file یا File API بیاد
  // اگر فایل لوکال هست، مثلاً با fetch یا fs بخون و تبدیل به Blob کن
  // payload.append("Images", file);

  payload.append("Description", "گل نرگس");

  console.log("FormData payload:");
  for (const [key, value] of payload.entries()) {
    console.log(key, value);
  }

  try {
    const { data } = await axiosInstance.post(
      "/AgriculturalProduct/CreateWithImages",
      payload
    );

    console.log("Response:", data);
    return data;
  } catch (error: any) {
    console.error("Error creating product:", error.response?.data || error);
    throw error;
  }
}

// export async function AddProduct(payload: FormData) {
//   console.log("FormData payload:");
//   for (const [key, value] of payload.entries()) {
//     console.log(key, value);
//   }

//   try {
//     const { data } = await axiosInstance.post(
//       "/AgriculturalProduct/CreateWithImages",
//       payload
//     );

//     return data;
//   } catch (error) {
//     console.error("Error creating product:", error);
//     throw error;
//   }
// }
