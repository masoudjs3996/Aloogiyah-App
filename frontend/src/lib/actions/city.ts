import axiosInstance from "@/shared/lib/config/axions";
import {
  ProvincesResponse,
  IProvinces,
  CountiesResponse,
  ICounties,
  CityAndVillageResponse,
  ICityAndVillage,
} from "@/shared/types/city";

export async function getProvinces(): Promise<IProvinces[] | null> {
  try {
    const { data } = await axiosInstance.get<ProvincesResponse>(
      "/location/provinces"
    );

    return data.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}

export async function getCounties(code: string): Promise<ICounties[] | null> {
  try {
    const { data } = await axiosInstance.get<CountiesResponse>(
      `/location/Counties?provinceCode=${code}`
    );

    return data.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}

export async function getCityAndVillage(code: string): Promise<ICityAndVillage[] | null> {
  try {
    const { data } = await axiosInstance.get<CityAndVillageResponse>(
      `/location/CityAndVillage?countyCode=${code}`
    );
    return data.data ?? null;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return null;
  }
}