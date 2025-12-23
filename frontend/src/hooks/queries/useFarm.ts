import {
  GetMyFarm,
  GetMyFarmDetail,
} from "@/lib/actions/farm";
import { useQuery } from "@tanstack/react-query";

export const useMyFarm = (code?: string) => {
  const myFarmsQuery = useQuery({
    queryKey: ["GetMyFarm"],
    queryFn: GetMyFarm,
    staleTime: 1000 * 60 * 2,
  });
  const farmDetailQuery = useQuery({
    queryKey: ["GetMyFarmDetail", code],
    queryFn: () => GetMyFarmDetail(code!),
    enabled: !!code,
    staleTime: 1000 * 60 * 2,
  });

  return {
    farms: myFarmsQuery.data,
    farmsError: myFarmsQuery.error,
    farmsLoading: myFarmsQuery.isLoading,
    farmsSuccess: myFarmsQuery.isSuccess,
    farmDetail: farmDetailQuery.data,
    farmDetailError: farmDetailQuery.error,
    farmDetailLoading: farmDetailQuery.isLoading,
    farmDetailSuccess: farmDetailQuery.isSuccess,
  };
};
