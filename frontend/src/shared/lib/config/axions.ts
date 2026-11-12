import axios, { type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { refreshAccessToken } from "./getRefreshToken";
const axiosInstance = axios.create({
  baseURL:
    typeof window === "undefined"
      ? (
          process.env.API_BASE_URL ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          "http://localhost:5056/api"
        ).replace(/\/+$/, "")
      : "/api",
  timeout: 20000,
});
export const bearer = (token: string) =>
  /^Bearer\s/i.test(token) ? token : `Bearer ${token}`;
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get("token") || Cookies.get("guestToken");
  if (token) config.headers.Authorization = bearer(token);
  return config;
});
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    if (
      !config ||
      error.response?.status !== 401 ||
      config._retry ||
      /\/Auth\/(RefreshToken|GuestToken)/i.test(config.url || "")
    )
      return Promise.reject(error);
    config._retry = true;
    try {
      const token = await refreshAccessToken();
      if (token) {
        config.headers.Authorization = bearer(token);
        return axiosInstance(config);
      }
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
    return Promise.reject(error);
  },
);
export default axiosInstance;
