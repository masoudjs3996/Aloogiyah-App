import { GetMyNotifications } from "@/lib/actions/notifications";
import { useQuery } from "@tanstack/react-query";

export const useNotifications = () => {
  const { data, error, isLoading, isSuccess } = useQuery({
    queryKey: ["GetMyNotifications"],
    queryFn: GetMyNotifications,
    staleTime: 1000 * 60 * 2,
  });

  return {
    data,
    error,
    isLoading,
    isSuccess,
  };
};
