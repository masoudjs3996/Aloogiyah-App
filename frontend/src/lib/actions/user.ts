import axiosInstance from "@/shared/lib/config/axions";
import { getGuestTokenResponse } from "@/shared/types/user";

export const getGuestToken = async (): Promise<getGuestTokenResponse> => {
  const { data } =
    await axiosInstance.post<getGuestTokenResponse>("/Auth/GuestToken");
  return data;
};
