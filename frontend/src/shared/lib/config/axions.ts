import axios, { AxiosInstance } from "axios";
import { refreshAccessToken } from "./getRefreshToken";
import Cookies from "js-cookie";
const baseURL =
  typeof window === "undefined" ? process.env.NEXT_PUBLIC_BASE_URL : "/api";
// baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api",
const axiosInstance: AxiosInstance = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  baseURL: baseURL,
  // timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    const GuestUserToken = Cookies.get("guestToken");

    if (token) {
      config.headers.Authorization = token;
    } else if (GuestUserToken) {
      config.headers.Authorization = GuestUserToken;
    }
    return config;
    // const token = Cookies.get("token");
    // if (token && config.headers) {
    //   config.headers.Authorization = token;
    // }
    // return config;
  },
  (error) => Promise.reject(error),
);
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        const response = await refreshAccessToken();
        const token = Cookies.get("token");
        const GuestUserToken = Cookies.get("guestToken");

        if (token) {
          config.headers.Authorization = token;
        } else if (GuestUserToken) {
          config.headers.Authorization = GuestUserToken;
        }
        return axiosInstance(config);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       console.warn("Unauthorized! Redirect to login maybe...");
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;

// import axios from "axios";
// import { toast } from "../utils/Toast/Toast";
// import { refreshAccessToken } from "./getRefreshToken";
// import { redirectToError } from "../utils/RedirectToError/redirectToError";

// const API_URL = "https://api.eghlym.com";
// const axiosInstance = axios.create({
//   baseURL: API_URL,
//   headers: {
//     accept: "*/*",
//     "X-Requested-With": "XMLHttpRequest",
//     "Content-Type": "application/json",
//   },
// });

// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = sessionStorage.getItem("UserToken");
//     const GuestUserToken = sessionStorage.getItem("GuestUserToken");
//     const userName = sessionStorage.getItem("userName");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       if (!userName) {
//         sessionStorage.removeItem("UserToken");
//         window.location.href = "/login";
//       }
//     } else if (GuestUserToken) {
//       config.headers.Authorization = `Bearer ${GuestUserToken}`;
//     }
//     return config;
//   },
//   (error) => {
//     if (error.config?.disableToast) {
//       return Promise.reject(error);
//     }
//   }
// );

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const config = error.config;

//     if (config?.disableToast) {
//       return Promise.reject(error);
//     }

//     if (error.response?.status === 401 && !config._retry) {
//       config._retry = true;

//       try {
//         const response = await refreshAccessToken();
//         const GuestUserToken = sessionStorage.getItem("GuestUserToken");
//         const token = sessionStorage.getItem("UserToken");
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         } else if (GuestUserToken) {
//           config.headers.Authorization = `Bearer ${GuestUserToken}`;
//         }

//         // ارسال دوباره درخواست با هدر جدید
//         return axiosInstance(config);
//       } catch (err) {
//         return Promise.reject(err);
//       }
//     }

//     // مدیریت خطاها
//     if (error.response) {
//       const status = error.response.status;
//       const errorMessage = error.response.data.message || "خطای نامشخص";
//       const requestUrl = error.config?.url || "نامشخص";

//       switch (status) {
//         case 400:
//           // toast(`درخواست نامعتبر:${requestUrl} ` + errorMessage, "error");
//           // redirectToError({
//           //   message: "درخواست شما قابل پردازش نیست. لطفاً دوباره بررسی کنید.",
//           //   backLink: "/",
//           //   backText: "بازگشت به خانه",
//           // });
//           break;
//         case 401:
//           // toast(`عدم دسترسی. لطفاً وارد شوید. ${requestUrl}`, "error");
//           // redirectToError({
//           //   message:
//           //     "مدت زمان اعتبار شما تمام شده. لطفاً ورود مجدد انجام دهید.",
//           //   backLink: "/login",
//           //   backText: "ورود به حساب کاربری",
//           // });
//           break;
//         case 403:
//           // toast(`دسترسی غیرمجاز.${requestUrl}`, "error");
//           // redirectToError({
//           //   message: "شما اجازه دسترسی به این بخش را ندارید",
//           //   backLink: "/",
//           //   backText: "بازگشت به صفحه اصلی",
//           // });
//           break;
//         case 404:
//           // toast(`منبع یافت نش404 ${requestUrl}`, "error");
//           // redirectToError({
//           //   message: "ما نتونستیم صفحه مورد نظر شما رو پیدا کنیم. ",
//           //   backLink: "/",
//           //   backText: "بازگشت به خانه",
//           // });
//           break;
//         case 500:
//           // toast(`خطای سرور. لطفاً بعداً امتحان کنید.${requestUrl}`, "warning");
//           // redirectToError({
//           //   message: "سرورمون یه لحظه حالش بد شد... الان درستش می‌کنیم ",
//           //   backLink: "/",
//           //   backText: "بازگشت به صفحه اصلی",
//           // });
//           break;
//         default:
//           // toast("خطا: " + errorMessage, "error");
//         // redirectToError({
//         //   message: "مشکلی پیش  اومده لطفا دوباره تلاش کنید",
//         //   backLink: "/",
//         //   backText: "بازگشت به خانه",
//         // });
//       }
//     } else if (error.request) {
//       toast(
//         `عدم پاسخگویی سرور. لطفاً اتصال اینترنت خود را بررسی کنید.`,
//         "warning"
//       );
//     } else {
//       toast("یک خطای ناشناخته رخ داده است.", "warning");
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
