"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { setUser, logout } from "@/lib/store/slices/userSlice";
import { platformApi } from "@/lib/actions/platform";
import { getGuestToken } from "@/lib/actions/user";
import { cookieOptions } from "@/shared/lib/config/getRefreshToken";
let initializing = null as Promise<unknown> | null;
export default function AuthInitializer() {
 const dispatch = useDispatch(); const client = useQueryClient();
 const profile = useQuery({ queryKey: ["platform", "profile"], queryFn: () => platformApi.profile(), staleTime: 60000, retry: 1 });
 useEffect(() => {
   if (Cookies.get("token") || Cookies.get("guestToken") || Cookies.get("refreshToken")) return;
   if (!initializing) initializing = getGuestToken().then(result => { if (result.data?.token) Cookies.set("guestToken", result.data.token, cookieOptions(30)); }).finally(() => { initializing = null; });
   initializing.then(() => { client.invalidateQueries(); }).catch(() => {});
 }, [client]);
 useEffect(() => { if (profile.data?.user && !profile.data.isGuest) dispatch(setUser(profile.data.user)); else if (profile.data?.isGuest || profile.isError) dispatch(logout()); }, [profile.data, profile.isError, dispatch]);
 return null;
}
