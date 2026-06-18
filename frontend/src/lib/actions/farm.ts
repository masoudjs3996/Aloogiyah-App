import axiosInstance from "@/shared/lib/config/axions";
import {
  CreateFarmResponse,
  DetailFarmResponse,
  GetFarmByFilterResponse,
  GetMyFarmResponse,
} from "@/shared/types/farm";

export async function CreateFarm(
  payload: FormData,
): Promise<CreateFarmResponse | null> {
  try {
    const { data } = await axiosInstance.post<CreateFarmResponse>(
      "/Farm/Create",
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}
export async function GetMyFarm(): Promise<GetMyFarmResponse | null> {
  try {
    const { data } =
      await axiosInstance.get<GetMyFarmResponse>("/Farm/GetMyFarm");
    return data ?? null;
  } catch (error) {
    console.error("Error fetching MyFarm:", error);
    return null;
  }
}
export async function GetMyFarmDetail(
  code: string,
): Promise<DetailFarmResponse | null> {
  try {
    const { data } = await axiosInstance.get<DetailFarmResponse | null>(
      `/Farm/GetByCode?code=${code}`,
    );
    return data ?? null;
  } catch (error) {
    console.error("Error fetching MyFarm:", error);
    return null;
  }
}
export async function GetFarmsByFilter(): Promise<GetFarmByFilterResponse | null> {
  try {
    const { data } = await axiosInstance.get<GetFarmByFilterResponse>(
      "/Farm/GetByFilter?StatusCode=%20",
    );
    return data ?? null;
  } catch (error) {
    console.error("Error fetching MyFarm:", error);
    return null;
  }
}
