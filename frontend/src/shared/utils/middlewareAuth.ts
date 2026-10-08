import { NextRequest } from "next/server";
import type { GetUserRoulResponse } from "../types/user";
export const middlewareAuth = async (request: NextRequest): Promise<GetUserRoulResponse | null> => {
 const token = request.cookies.get("token")?.value;
 if (!token) return null;
 const base = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5056/api").replace(/\/+$/, "");
 const authorization = /^Bearer\s/i.test(token) ? token : `Bearer ${token}`;
 try {
   const response = await fetch(`${base}/User/GetRole`, { headers: { Authorization: authorization, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(10000) });
   if (!response.ok) return null;
   const result = await response.json();
   return result?.isSuccess && result?.data?.roleName ? result : null;
 } catch { return null; }
};
