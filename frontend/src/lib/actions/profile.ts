import type { ApiResult, Profile } from "@/shared/types/platform";
import axiosInstance from "@/shared/lib/config/axions";
import {
  EditUserResponse,

  UpdateProfileImageResponse,
} from "@/shared/types/user";

export async function getUserInfo(): Promise<ApiResult<Profile> | null> {
  try {
    const { data } = await axiosInstance.get<ApiResult<Profile> | null>(
      "/User/GetMyProfile"
    );
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}
export async function editUserInfo(
  payload: any
): Promise<EditUserResponse | null> {
  try {
    const { data } = await axiosInstance.put<EditUserResponse>(
      "/User/UpdateProfile",
      payload
    );
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function uploadProfileImage(
  file: File
): Promise<UpdateProfileImageResponse | null> {
  try {
    const formData = new FormData();
    formData.append("File", file);

    const { data } =
      await axiosInstance.post<UpdateProfileImageResponse | null>(
        "/User/UploadProfileImage",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

    return data;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
}
