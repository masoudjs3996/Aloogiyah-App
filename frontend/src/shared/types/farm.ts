import { IApiResponse } from "./general";

export interface ICreateFarmResponse {
  code: string;
  name: string;
  description: string;
  ownerCode: string;
  address: {
    code: string;
    userCode: string;
    street: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
    provinceCode: string;
    provinceName: string;
    countyCode: string;
    countyName: string;
    cityCode: string | null;
    cityName: string | null;
    villageCode: string | null;
    villageName: string | null;
    createdAt: string;
    updatedAt: string | null;
  };
  capacity: number;
  createdAt: string;
  minPurchase: number;
  imageUrl: string | null;
}


export interface IGetMyFarm
  extends Pick<ICreateFarmResponse, "name" | "code" | "description"> {}
export type GetMyFarmResponse = IApiResponse<IGetMyFarm[]>;

export type CreateFarmResponse = IApiResponse<ICreateFarmResponse>;
export type GetFarmByFilterResponse = IApiResponse<ICreateFarmResponse[]>;

export type DetailFarmResponse = CreateFarmResponse;
