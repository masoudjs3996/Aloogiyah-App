import { getProducts } from "@/lib/actions/product";

import { useQuery } from "@tanstack/react-query";

export const useProducts = (farmCode: string) => {
  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey: ["products", farmCode],
    queryFn: () => getProducts(farmCode),
    enabled: !!farmCode,
    staleTime: 1000 * 60 * 2,
  });

  return {
    products: data?.items ?? [],
    pagination: data,
    error,
    isLoading,
    isSuccess,
  };
};
