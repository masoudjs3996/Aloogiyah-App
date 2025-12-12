import { IApiResponse } from "./general";

export interface IProvinces {
  code: string;
  name: string;
  statusCode: string;
  statusName: string;
}

export interface ICounties extends IProvinces {
  provinceCode: string;
  provinceName: string;
}

export interface ICityAndVillage extends IProvinces {
  latitude: number | null;
  longitude: number | null;
  type: string;
}

export type ProvincesResponse = IApiResponse<IProvinces[]>;
export type CountiesResponse = IApiResponse<ICounties[]>;
export type CityAndVillageResponse = IApiResponse<ICityAndVillage[]>;
