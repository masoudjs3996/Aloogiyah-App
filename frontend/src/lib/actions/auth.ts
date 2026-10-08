import axiosInstance from "@/shared/lib/config/axions";
import { LoginResponse, RegisterResponse } from "@/shared/types/auth";

export type PhoneCodeResponse = {
  isSuccess: boolean;
  message: string;
  data?: { challengeCode: string; expiresAt: string; testCode?: string | null };
};

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

export const RequestPhoneCode = async (params: {
  phoneNumber: string;
  purpose: "Login" | "Register";
  fName?: string;
  lName?: string;
}): Promise<PhoneCodeResponse> => {
  const { data } = await axiosInstance.post<PhoneCodeResponse>("/Auth/RequestPhoneCode", params);
  return data;
};

export const VerifyPhoneCode = async (params: {
  challengeCode: string;
  code: string;
}): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post<LoginResponse>("/Auth/VerifyPhoneCode", params);
  return data;
};
