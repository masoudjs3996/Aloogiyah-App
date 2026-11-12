"use client";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { platformApi } from "@/lib/actions/platform";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
export function useUnreadChatCount() {
  const profile = usePlatformProfile();
  const me = profile.data?.user?.code || "";
  const enabled = !!me && !profile.data?.isGuest && !!Cookies.get("token");
  const rooms = useQuery({
    queryKey: ["platform", "chat-rooms", me],
    queryFn: ({ signal }) => platformApi.chatRooms(signal),
    enabled,
    staleTime: 5000,
    refetchInterval: enabled ? 15000 : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  return {
    enabled,
    count: enabled
      ? (rooms.data || []).reduce(
          (sum, room) =>
            sum + Math.max(0, Math.trunc(Number(room.unreadCount) || 0)),
          0,
        )
      : 0,
  };
}
