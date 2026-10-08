"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserRoul } from "@/lib/actions/user";

const WHOLESALE_ROLES = new Set(["Buyer", "Farmer", "Admin", "Manager"]);
const BOTH_PRICE_ROLES = new Set(["Buyer", "Farmer", "Admin", "Manager"]);

export function useCommercePricing() {
  const roleQuery = useQuery({
    queryKey: ["current-user-commerce-role"],
    queryFn: getUserRoul,
    staleTime: 60_000,
    retry: false,
  });
  const roleData = roleQuery.data?.data;
  const roles = roleData?.roleNames?.length
    ? roleData.roleNames
    : [roleData?.roleName ?? ""];
  return {
    wholesale: roles.some((role) => WHOLESALE_ROLES.has(role)),
    showBoth: roles.some((role) => BOTH_PRICE_ROLES.has(role)),
  };
}
