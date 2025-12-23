import { getProducts } from "@/lib/actions/product";
import { useQuery } from "@tanstack/react-query";

export const useProducts = (farmCode?: string) => {
  const normalizedFarmCode = farmCode?.trim() ? farmCode.trim() : undefined;
  const queryKey = ["products", normalizedFarmCode ?? "all"];

  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey,
    queryFn: () => getProducts(normalizedFarmCode),
    // enabled: !!normalizedFarmCode,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  return {
    products: data?.items ?? [],
    pagination: data ?? null,
    totalCount: data?.totalCount ?? 0,
    error,
    isLoading,
    isSuccess,
  };
};
