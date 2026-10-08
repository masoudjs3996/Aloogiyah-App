"use client";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { logout } from "@/lib/store/slices/userSlice";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { getGuestToken } from "@/lib/actions/user";
import { cookieOptions } from "@/shared/lib/config/getRefreshToken";
export default function useLogout() {
 const dispatch = useDispatch(); const client = useQueryClient(); const router = useRouter();
 return async () => { Cookies.remove("token"); Cookies.remove("refreshToken"); Cookies.remove("guestToken"); dispatch(logout()); await client.cancelQueries(); client.clear(); try { const data = await getGuestToken(); if (data.data?.token) Cookies.set("guestToken", data.data.token, cookieOptions(30)); } catch {} router.push("/"); router.refresh(); };
}
