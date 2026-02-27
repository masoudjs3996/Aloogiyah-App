import axiosInstance from "@/shared/lib/config/axions";
import { getGuestTokenResponse, GetUserRoulResponse } from "@/shared/types/user";

export const getGuestToken = async (): Promise<getGuestTokenResponse> => {
  const { data } =
    await axiosInstance.post<getGuestTokenResponse>("/Auth/GuestToken");
  return data;
};

export const getUserRoul = async (): Promise<GetUserRoulResponse> => {
  const { data } =
    await axiosInstance.get<GetUserRoulResponse>("/User/GetRole");
  return data;
};
