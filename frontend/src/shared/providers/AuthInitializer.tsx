"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/store/slices/userSlice";
import { useProfile } from "@/hooks/queries/useProfile";
import Cookies from "js-cookie";
import useGuestToken from "@/hooks/mutations/useGuestToken";
export default function AuthInitializer() {
  const dispatch = useDispatch();
  const { data, isError, isLoading } = useProfile();
  const { mutateAsync: getTokenGuest } = useGuestToken();

  useEffect(() => {
    const getToken = async () => {
      if (!Cookies.get("token")) {
        const data = await getTokenGuest();
        if (data.data?.token) {
          Cookies.set("guestToken", data.data?.token, {
            expires: 30,
            secure: true,
            sameSite: "strict",
          });
        }
      }
    };
    getToken();
  }, []);

  useEffect(() => {
    if (data) {
      dispatch(setUser(data?.data?.user));
    }
  }, [data]);

  return null;
}
