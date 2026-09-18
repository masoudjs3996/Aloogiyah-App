import { NextRequest } from "next/server";
import type { GetUserResponse } from "../types/user";

export const middlewareAuth = async (
  request: NextRequest,
): Promise<GetUserResponse | null> => {
  try {
    const guestToken = request.cookies.get("guestToken")?.value;
    const userToken = request.cookies.get("token")?.value;

    const token = userToken || guestToken;

    if (!token) {
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL is not defined");
      return null;
    }

    const res = await fetch(`${baseUrl}User/GetRole`, {
      method: "GET",
      headers: {
        Authorization: token,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    // توکن منقضی، نامعتبر یا درخواست ناموفق
    if (!res.ok) {
      return null;
    }

    const text = await res.text();

    // جلوگیری از JSON.parse روی پاسخ خالی
    if (!text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text) as GetUserResponse;
    } catch {
      console.error("GetRole returned invalid JSON:", text);
      return null;
    }
  } catch (error) {
    console.error("middlewareAuth error:", error);
    return null;
  }
};

// import { NextRequest } from "next/server";
// import { GetUserResponse } from "../types/user";

// export const middlewareAuth = async (request: NextRequest) => {
//   // const token = request.cookies.get("guestToken");
//   const guestToken = request?.cookies?.get("guestToken");
//   const userToken = request?.cookies?.get("token");

//   const token = guestToken || userToken;
//   const res = await fetch(
//     `${process?.env?.NEXT_PUBLIC_BASE_URL}User/GetRole`,
//     {
//       method: "GET",
//       headers: {
//         Authorization: `${token?.value ? token?.value : ""}`,
//         Accept: "*/*",
//       },
//     },
//   );

//   const text = await res?.text();

//   const data = JSON?.parse(text);

//   return data || null;
// };
