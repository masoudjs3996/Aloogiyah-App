import { GetCart } from "@/lib/actions/cart";
import { useQuery } from "@tanstack/react-query";

export const useCart = () => {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["userGetCart"],
    queryFn: async () => await GetCart(),
    staleTime: 1000 * 60 * 2,
  });
  return {
    data,
    isError,
    isLoading,
  };
};
