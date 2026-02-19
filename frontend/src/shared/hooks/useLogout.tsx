"use client";

import { useDispatch } from "react-redux";
import { logout } from "@/lib/store/slices/userSlice";
import Cookies from "js-cookie";
import useGuestToken from "@/hooks/mutations/useGuestToken";
import { useRouter } from "next/navigation";

export default function useLogout() {
  const dispatch = useDispatch();
  const { mutateAsync: getTokenGuest } = useGuestToken();
  const router = useRouter();
  const handleLogout = async () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    dispatch(logout());

    try {
      const data = await getTokenGuest();
      if (data?.data?.token) {
        Cookies.set("guestToken", data.data.token, {
          expires: 30,
          secure: true,
          sameSite: "strict",
        });
      }
    } catch (err) {
      console.error("Guest token error:", err);
    }
    router.push("/");
  };

  return handleLogout;
}
