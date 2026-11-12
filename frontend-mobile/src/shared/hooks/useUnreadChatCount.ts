import { usePollingInterval } from "./usePollingInterval";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../providers/AuthProvider";
import { platformApi } from "../../api/platform";
export function useUnreadChatCount() {
  const { signedIn } = useAuth();
  const focused = useIsFocused();
  const rooms = useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: ({ signal }) => platformApi.chatRooms(signal),
    enabled: signedIn && focused,
    staleTime: 5000,
    refetchInterval: usePollingInterval(signedIn && focused ? 15000 : false),
  });
  return signedIn
    ? (rooms.data || []).reduce(
        (sum, room) =>
          sum + Math.max(0, Math.trunc(Number(room.unreadCount) || 0)),
        0,
      )
    : 0;
}
