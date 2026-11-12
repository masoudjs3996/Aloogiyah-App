import {
  GetDetailProduct,
  getProducts,
  GetSimilar,
} from "@/lib/actions/product";
import { ProductFilter } from "@/shared/types/product";
import { useQuery } from "@tanstack/react-query";

export const useProducts = (filters?: ProductFilter) => {
  const queryKey = ["products", filters];

  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey,
    queryFn: () => getProducts(filters),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  return {
    products: data,
    error,
    isLoading,
    isSuccess,
  };
};

export const useProduct = (productId?: string) => {
  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey: ["productId", productId],
    queryFn: () => GetDetailProduct(productId),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  return {
    product: data ?? {},
    isLoading,
    isSuccess,
  };
};

export const useSimilarProduct = (payload?: {
  ProductCode: string;
  PageNumber: number;
  PageSize: number;
  SortColumn: string;
  SortDescending: boolean;
}) => {
  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["similarProduct", payload],
    queryFn: () => GetSimilar(payload),
    enabled: !!payload?.ProductCode,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  return {
    similarProduct: data ?? {},
    isLoading,
    isSuccess,
  };
};
