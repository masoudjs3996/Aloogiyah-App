import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useRealtimeChat } from "../providers/ChatRealtimeProvider";
export function useChatSocket(room?: string) {
  const focused = useIsFocused();
  const { connected, peerOnline, setRoom } = useRealtimeChat();
  useEffect(() => {
    if (!focused || !room) return;
    setRoom(room);
    return () => setRoom(undefined);
  }, [focused, room, setRoom]);
  return {
    connected: connected && focused,
    peerOnline: focused && room ? peerOnline : null,
  };
}
