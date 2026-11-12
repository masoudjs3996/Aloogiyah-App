import { useQuery } from "@tanstack/react-query";
import { request } from "../../api/platform";
import { useAuth, useProfile } from "../providers/AuthProvider";
export function useRoles() {
  const signedIn = useAuth().signedIn;
  const profile = useProfile();
  const q = useQuery({
    queryKey: ["roles", signedIn],
    queryFn: () =>
      request<{ roleName: string; roleNames?: string[] }>("/User/GetRole"),
    enabled: signedIn,
    staleTime: 60000,
  });
  const roles = q.data?.roleNames?.length ? q.data.roleNames : [
    q.data?.roleName || profile.data?.user?.roleName || "",
  ];
  return {
    roles,
    has: (...names: string[]) => roles.includes("Manager") || roles.some((r) => names.includes(r)),
    error: q.error,
  };
}

