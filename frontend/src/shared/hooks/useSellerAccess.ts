"use client";
import { useQuery } from "@tanstack/react-query";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import { getUserRoul } from "@/lib/actions/user";

export function useSellerAccess() {
  const profile = usePlatformProfile();
  const signedIn = !!profile.data?.user && !profile.data.isGuest && !profile.isError;
  const query = useQuery({ queryKey: ["current-user-commerce-role"], queryFn: getUserRoul, enabled: signedIn, staleTime: 60000 });
  const roleData = query.data?.data;
  const roles = roleData?.roleNames?.length ? roleData.roleNames : [roleData?.roleName || profile.data?.user?.roleName || ""];
  return { allowed: signedIn && !query.isError && roles.includes("Farmer"), loading: profile.isLoading || signedIn && query.isLoading, error: profile.error || query.error };
}
