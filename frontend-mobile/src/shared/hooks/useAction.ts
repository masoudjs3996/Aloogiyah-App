import { useState, useRef } from "react";
import { appAlert as Alert } from "../alerts";
import { useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "../../api/platform";
export function useAction() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const client = useQueryClient();
  const run = async <T>(
    fn: () => Promise<T>,
    success?: string,
  ): Promise<T | undefined> => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const value = await fn();
      await client.invalidateQueries();
      if (success)
        Alert.alert("انجام شد", success, undefined, { tone: "success" });
      return value;
    } catch (e) {
      Alert.alert("عملیات انجام نشد", errorMessage(e), undefined, {
        tone: "error",
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { busy, run };
}
