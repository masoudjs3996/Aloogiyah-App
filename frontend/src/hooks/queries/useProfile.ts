import { getUserInfo } from "@/lib/actions/profile";
import { useQuery } from "@tanstack/react-query";

export const useProfile = () => {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => await getUserInfo(),
    staleTime: 1000 * 60 * 2,
  });
  return {
    data,
    isError,
    isLoading,
  };
};
