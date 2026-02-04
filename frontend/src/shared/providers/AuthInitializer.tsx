"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/store/slices/userSlice";
import { useProfile } from "@/hooks/queries/useProfile";
import Cookies from "js-cookie";
export default function AuthInitializer() {
  const dispatch = useDispatch();
  const { data, isError, isLoading } = useProfile();
  useEffect(() => {
    if (data) {
      Cookies.set("guestToken", date?.guestToken, {
        expires: 30,
        secure: true,
        sameSite: "strict",
      });
      dispatch(setUser(data?.data));
    }
  }, [data]);
  return null;
}
