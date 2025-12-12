import axiosInstance from "@/shared/lib/config/axions";
import { GetRewardsResponse } from "@/shared/types/rewards";

export async function getDiscount(
  payload?: any
): Promise<GetRewardsResponse | null> {
  try {
    const { data } = await axiosInstance.get<GetRewardsResponse>(
      "/Discount/GetByFilter"
    );
    return data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}
