import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { isRateLimited } from "../../api/queryPolicy";

// Stop polling hidden screens and rejected queries; manual refetch remains available.
export function usePollingInterval(interval: number | false) {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => setActive(state === "active"));
    return () => subscription.remove();
  }, []);
  return (query: { state: { error: Error | null } }): number | false =>
    focused && active && !isRateLimited(query.state.error) ? interval : false;
}

