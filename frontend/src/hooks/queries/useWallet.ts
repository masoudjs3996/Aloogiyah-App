import { getWallet } from "@/lib/actions/wallet";
import { WalletResponse } from "@/shared/types/wallet";
import { useQuery } from "@tanstack/react-query";

export const useWallet = () => {
  const { data, error, isLoading, isSuccess, refetch } = useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
    staleTime: 1000 * 60 * 2,
  });

  return {
    data,
    error,
    isLoading,
    isSuccess,
    refetch,
  };
};
