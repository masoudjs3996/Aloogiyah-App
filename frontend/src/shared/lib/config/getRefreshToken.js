import Cookies from "js-cookie";
import axios from "axios";
// یک refresh مشترک، مانع تمدید هم‌زمان و چرخش چندباره refreshToken می‌شود.
let refreshing = null;
/** @returns {import("js-cookie").CookieAttributes} */
export const cookieOptions = (days) => ({
  expires: days,
  sameSite: "lax",
  secure:
    typeof window !== "undefined" && window.location.protocol === "https:",
});
export async function refreshAccessToken() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refreshToken = Cookies.get("refreshToken");
    const baseURL =
      typeof window === "undefined"
        ? (
            process.env.API_BASE_URL ||
            process.env.NEXT_PUBLIC_BASE_URL ||
            "http://localhost:5056/api"
          ).replace(/\/+$/, "")
        : "/api";
    try {
      if (refreshToken) {
        const response = await axios.post(
          `${baseURL}/Auth/RefreshToken`,
          JSON.stringify(refreshToken),
          { headers: { "Content-Type": "application/json" }, timeout: 20000 },
        );
        const result = response.data?.data;
        if (!result?.token) throw new Error("تمدید نشست انجام نشد");
        Cookies.set("token", result.token, cookieOptions(7));
        if (result.refreshToken)
          Cookies.set("refreshToken", result.refreshToken, cookieOptions(30));
        Cookies.remove("guestToken");
        return result.token;
      }
      if (Cookies.get("token")) {
        Cookies.remove("token");
        return null;
      }
      const response = await axios.post(
        `${baseURL}/Auth/GuestToken`,
        undefined,
        { timeout: 20000 },
      );
      if (response.data?.data?.token) {
        Cookies.set("guestToken", response.data.data.token, cookieOptions(30));
        return response.data.data.token;
      }
      return null;
    } catch (error) {
      if ([400, 401, 403].includes(error.response?.status)) {
        Cookies.remove("token");
        Cookies.remove("refreshToken");
      }
      throw error;
    }
  })();
  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}
