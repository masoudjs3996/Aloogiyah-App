import { getDiscount } from "@/lib/actions/discount";
import { useQuery } from "@tanstack/react-query";

export const useRewards = () => {
  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey: ["discount"],
    queryFn: getDiscount,
    staleTime: 1000 * 60 * 2,
  });

  return {
    data,
    error,
    isLoading,
    isSuccess,
  };
};
