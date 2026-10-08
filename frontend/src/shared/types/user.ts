import { IApiResponse } from "./general";

export interface IUser {
  code: string;
  fName: string;
  lName: string;
  email: string | null;
  userName: string;
  isEmailConfirmed: boolean;
  roleCode: string;
  roleName: string | null;
  phoneNumber: number | string;
  createdAt: string;
  updatedAt: string;
  profileImageUrl: string | null;
}

export type getGuestTokenResponse = IApiResponse<{ token: string }>;
export type GetUserResponse = IApiResponse<IUser>;
export type GetUserRoulResponse = IApiResponse<{
  roleName: string;
  roleCode: string;
  roleNames?: string[];
  roleCodes?: string[];
}>;

export type EditUserResponse = IApiResponse<IUser>;

export type UpdateProfileImageResponse = IApiResponse<{ data: string }>;
