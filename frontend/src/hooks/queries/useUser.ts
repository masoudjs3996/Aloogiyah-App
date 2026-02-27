import { GetMyFarm, GetMyFarmDetail } from "@/lib/actions/farm";
import { getUserRoul } from "@/lib/actions/user";
import { useQuery } from "@tanstack/react-query";

export const useUser = () => {
  const UserRoul = useQuery({
    queryKey: ["GetUserRoul"],
    queryFn: getUserRoul,
    staleTime: 1000 * 60 * 2,
  });

  return {
    roulData: UserRoul.data,
    roulDataError: UserRoul.error,
    roulDataLoading: UserRoul.isLoading,
    roulDataSuccess: UserRoul.isSuccess,
  };
};
