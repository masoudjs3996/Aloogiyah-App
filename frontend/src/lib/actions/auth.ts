import axiosInstance from "@/shared/lib/config/axions";
import { LoginResponse, RegisterResponse } from "@/shared/types/auth";

export const LoginUser = async (params: {
  userName: string;
  password: string;
}): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post<LoginResponse>(
    "Auth/Login",
    params
  );
  return data;
};

export const RegisterUser = async (params: {
  userName: string;
  password: string;
  fName: string;
  lName: string;
}): Promise<RegisterResponse> => {
  const { data } = await axiosInstance.post<RegisterResponse>(
    "/Auth/Register",
    params
  );
  return data;
};
