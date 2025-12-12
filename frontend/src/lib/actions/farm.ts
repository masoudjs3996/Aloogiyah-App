import axiosInstance from "@/shared/lib/config/axions";
import {
  CreateFarmResponse,
  DetailFarmResponse,
  GetMyFarmResponse,
} from "@/shared/types/farm";

export async function CreateFarm(
  payload: any
): Promise<CreateFarmResponse | null> {
  console.log(payload);
  try {
    const { data } = await axiosInstance.post<CreateFarmResponse>(
      "/Farm/Create",
      payload
    );

    return data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}
export async function GetMyFarm(): Promise<GetMyFarmResponse | null> {
  try {
    const { data } = await axiosInstance.get<GetMyFarmResponse>(
      "/Farm/GetMyFarm"
    );
    return data ?? null;
  } catch (error) {
    console.error("Error fetching MyFarm:", error);
    return null;
  }
}
export async function GetMyFarmDetail(
  code: string
): Promise<DetailFarmResponse | null> {
  try {
    const { data } = await axiosInstance.get<DetailFarmResponse | null>(
      `/Farm/GetByCode?code=${code}`
    );
    return data ?? null;
  } catch (error) {
    console.error("Error fetching MyFarm:", error);
    return null;
  }
}
