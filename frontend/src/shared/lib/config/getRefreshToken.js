import Cookies from "js-cookie";
import axiosInstance from "./axions";
export const refreshAccessToken = async () => {
  const refreshToken = Cookies.get("refreshToken");

  try {
    const response = await axiosInstance.post(
      "/Auth/RefreshToken",
      refreshToken
    );
    Cookies.set("token", response?.data.data.token, {
      expires: 7,
      secure: true,
      sameSite: "strict",
    });
    Cookies.set("refreshToken", response.data.data.refreshToken, {
      expires: 30,
      secure: true,
      sameSite: "strict",
    });
    return response.data.data.refreshToken;
  } catch (error) {
    console.log(error.status);
    const status = error?.status;
    if (status === 401 || status === 400) {
      window.location.href = "/login";
    } else {
      console.error(
        "Error refreshing token:",
        error.response ? error.response.data : error.message
      );
    }
  }
};
