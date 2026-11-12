import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { session } from "../../api/session";
import { api } from "../../api/mobile";
import { unregisterPush } from "../notifications";
import { clearChatMediaCache } from "../utils/chat-media-cache";
import type { Tokens } from "../types/mobile";
const Context = createContext({
  signedIn: false,
  login: async (_: Tokens) => {},
  logout: async () => {},
  ready: false,
  startupError: false,
  retry: () => {},
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const [ready, setReady] = useState(false);
  const [signedIn, setSigned] = useState(false);
  const [startupError, setError] = useState(false);
  const retry = () => {
    setError(false);
    session
      .load()
      .then(() => {
        setSigned(!!session.get());
        setReady(true);
      })
      .catch(() => setError(true));
  };
  useEffect(() => {
    const sync = () => {
      setSigned(!!session.get());
      if (!session.get()) {
        void client.cancelQueries();
        client.clear();
        void clearChatMediaCache().catch(() => undefined);
      }
      else { void client.invalidateQueries({ queryKey: ["roles"] }); void client.invalidateQueries({ queryKey: ["profile"] }); }
    };
    const off = session.subscribe(sync);
    retry();
    return off;
  }, [client]);
  const login = async (tokens: Tokens) => {
    if (session.get()) {
      try {
        await unregisterPush();
      } catch {
        /* Registration is transferred when the next account enables push. */
      }
    }
    await client.cancelQueries();
    client.clear();
    if (!tokens?.token) throw new Error("پاسخ ورود معتبر نیست");
    await session.set(tokens);
    await session.setGuest("");
  };
  const logout = async () => {
    try {
      await unregisterPush();
    } catch {
      /* Offline logout must remain available. */
    }
    await client.cancelQueries();
    client.clear();
    await session.set(null);
  };
  return (
    <Context.Provider
      value={{ ready, signedIn, login, logout, startupError, retry }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
export const useProfile = () => {
  const { signedIn, ready } = useAuth();
  return useQuery({
    queryKey: ["profile", signedIn],
    queryFn: api.profile,
    enabled: ready,
    staleTime: 60000,
  });
};


