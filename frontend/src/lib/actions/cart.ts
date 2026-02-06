import axiosInstance from "@/shared/lib/config/axions";

export const AddCart = async (params: {
  cartId: number | string;
  productCode: string;
  quantity: number;
}) => {
  const { data } = await axiosInstance.post("/Cart/Add", params);
  return data;
};
