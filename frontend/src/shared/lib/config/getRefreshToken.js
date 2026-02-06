import Cookies from "js-cookie";
import axiosInstance from "./axions";
import { getGuestToken } from "@/lib/actions/user";
import axios from "axios";

export const refreshAccessToken = async () => {
  console.log("REFRESH FUNCTION CALLED");
  const refreshToken = Cookies.get("refreshToken");

  // 1️⃣ اگر refreshToken نداریم → مستقیم guest
  if (!refreshToken) {
    const data = await getGuestToken();

    if (data?.data?.token) {
      Cookies.set("guestToken", data.data.token, {
        expires: 30,
        secure: true,
        sameSite: "strict",
      });
    }

    return null;
  }

  try {
    // 2️⃣ تلاش برای refresh
    const response = await axios.post(
      "http://localhost:5056/api/Auth/RefreshToken",
      `"${refreshToken}"`,
      {
        headers: {
          "Content-Type": "application/json",
          // Authorization: tokenInHeader,
          accept: "*/*",
        },
      },
    );
    console.log(response);

    const { token, refreshToken: newRefreshToken } = response?.data?.data || {};

    // 3️⃣ فقط اگر معتبر بود ست کن
    if (token) {
      Cookies.set("token", token, {
        expires: 7,
        secure: true,
        sameSite: "strict",
      });
    }

    if (newRefreshToken) {
      Cookies.set("refreshToken", newRefreshToken, {
        expires: 30,
        secure: true,
        sameSite: "strict",
      });
    }

    return token;
  } catch (error) {
    const status = error?.response?.status;
    console.log("hi im here ");

    // 4️⃣ هر خطای auth → guest
    if (status === 401 || status === 400 || status === 415) {
      console.log("error box");
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      const data = await getGuestToken();

      if (data?.data?.token) {
        Cookies.set("guestToken", data.data.token, {
          expires: 30,
          secure: true,
          sameSite: "strict",
        });
      }

      return null;
    }

    console.error(
      "Error refreshing token:",
      error.response ? error.response.data : error.message,
    );

    throw error;
  }
};

// import Cookies from "js-cookie";
// import axiosInstance from "./axions";
// import { getGuestToken } from "@/lib/actions/user";
// export const refreshAccessToken = async () => {
//   const refreshToken = Cookies.get("refreshToken");

//   try {
//     const response = await axiosInstance.post(
//       "/Auth/RefreshToken",
//       refreshToken,
//     );
//     Cookies.set("token", response?.data.data.token, {
//       expires: 7,
//       secure: true,
//       sameSite: "strict",
//     });
//     Cookies.set("refreshToken", response.data.data.refreshToken, {
//       expires: 30,
//       secure: true,
//       sameSite: "strict",
//     });
//     return response.data.data.refreshToken;
//   } catch (error) {
//     const status = error?.response?.status;
//     if (status === 401 || status === 400 || status === 415) {
//       const data = await getGuestToken();
//       if (data.data?.token) {
//         Cookies.set("guestToken", data.data?.token, {
//           expires: 30,
//           secure: true,
//           sameSite: "strict",
//         });
//       }
//       // window.location.href = "/login";
//     } else {
//       console.error(
//         "Error refreshing token:",
//         error.response ? error.response.data : error.message,
//       );
//     }
//   }
// };
