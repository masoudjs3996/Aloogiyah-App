import { string } from "yup";
import { IApiResponse } from "./general";

export interface IUser {
  code: string;
  fName: string;
  lName: string;
  email: string | null;
  userName: string;
  isEmailConfirmed: boolean;
  age: number;
  role: number;
  roleName: string | null;
  phoneNumber: number | string;
  createdAt: string;
  updatedAt: string;
  profileImageUrl: string | null;
}

export type GetUserResponse = IApiResponse<IUser>;

export type EditUserResponse = IApiResponse<IUser>;

export type UpdateProfileImageResponse = IApiResponse<{ data: string }>;
